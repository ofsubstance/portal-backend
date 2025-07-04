import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { UserSession } from 'src/entities/user_sessions.entity';
import { WatchSession } from 'src/entities/watch_sessions.entity';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';

interface VideoMetric {
  videoId: string;
  videoTitle: string;
  totalSessions: number;
  completedSessions: number;
  totalWatchTimeMinutes: number;
  averageWatchPercentage: number;
  lastWatched: Date | null;
}

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  engagedSessions: number;
  averageSessionDuration: number;
  lastSessionDate: Date | null;
}

interface WatchMetrics {
  totalWatchSessions: number;
  totalWatchTimeMinutes: number;
  averageWatchPercentage: number;
  completedVideos: number;
  partiallyWatchedVideos: number;
  brieflyWatchedVideos: number;
  uniqueVideosWatched: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ShareableLink) private shareLinkRepo: Repository<ShareableLink>,
    @InjectRepository(WatchSession) private watchSessionRepo: Repository<WatchSession>,
    @InjectRepository(UserSession) private userSessionRepo: Repository<UserSession>
  ) {}

  async findUser(id: string) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) return errorhandler(404, 'User not found');
    const { password, ...response } = user;
    return successHandler('User found', response);
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email },
      select: [
        'id',
        'email',
        'password',
        'role',
        'status',
        'firstname',
        'lastname',
        'last_login',
        'first_content_engagement',
        'createdAt',
        'updatedAt',
      ],
    });
    return user ? [user] : [];
  }

  async findAllUsers() {
    const users = await this.userRepo.find({
      relations: ['profile'],
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        last_login: true,
        first_content_engagement: true,
        role: true,
        status: true,
        sms_consent: true,
        email_consent: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          id: true,
          business_name: true,
          website: true,
          state_region: true,
          country: true,
          utilization_purpose: true,
          interests: true
        }
      }
    });

    return successHandler('Users found', users);
  }

  async updateUser(id: string, attributes: Partial<User>) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) return errorhandler(404, 'User not found');
    Object.assign(user, attributes);
    const updatedUser = await this.userRepo.save(user);
    const { password, ...response } = updatedUser;
    return successHandler('User updated successfully', response);
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) errorhandler(404, 'User not found');
    await this.userRepo.remove(user);
    return successHandler('User deleted successfully', null);
  }

  async updateFirstContentEngagement(id: string) {
    const user = await this.userRepo.findOneBy({ id: id });
    if (!user) return errorhandler(404, 'User not found');
    user.first_content_engagement = new Date();
    await this.userRepo.save(user);
    return successHandler('First content engagement updated successfully', null);
  }

  async getUserEngagement(id: string) {
    // Check if user exists
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      return errorhandler(404, 'User not found');
    }

    // Get user sessions with their watch sessions
    const userSessions = await this.userSessionRepo.find({
      where: { user: { id } },
      order: { startTime: 'DESC' }
    });

    // Get all watch sessions for this user's sessions
    let watchSessions = [];
    if (userSessions.length > 0) {
      watchSessions = await this.watchSessionRepo
        .createQueryBuilder('watchSession')
        .leftJoinAndSelect('watchSession.video', 'video')
        .where('watchSession.userSessionId IN (:...userSessionIds)', {
          userSessionIds: userSessions.map(session => session.id)
        })
        .andWhere('watchSession.isGuestWatchSession = :isGuest', { isGuest: false })
        .orderBy('watchSession.startTime', 'DESC')
        .getMany();
    }

    // Get shareable links data
    const shareableLinks = await this.shareLinkRepo.find({
      where: { user: { id } },
      relations: ['video', 'engagements'],
      order: { createdAt: 'DESC' }
    });

    // Calculate session metrics
    const sessionMetrics: SessionMetrics = {
      totalSessions: userSessions.length,
      activeSessions: userSessions.filter(session => session.isActive).length,
      engagedSessions: userSessions.filter(session => session.contentEngaged).length,
      averageSessionDuration: 0,
      lastSessionDate: userSessions[0]?.startTime || null
    };

    // Calculate average session duration for completed sessions
    const completedSessions = userSessions.filter(session => session.endTime);
    if (completedSessions.length > 0) {
      const totalDuration = completedSessions.reduce((sum, session) => {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        return sum + duration;
      }, 0);
      sessionMetrics.averageSessionDuration = Math.round(totalDuration / completedSessions.length / 1000 / 60); // in minutes
    }

    // Calculate watch session metrics
    const watchMetrics: WatchMetrics = {
      totalWatchSessions: watchSessions.length,
      totalWatchTimeMinutes: 0,
      averageWatchPercentage: 0,
      completedVideos: 0, // videos watched 80% or more
      partiallyWatchedVideos: 0, // videos watched between 20% and 80%
      brieflyWatchedVideos: 0, // videos watched less than 20%
      uniqueVideosWatched: new Set(watchSessions.map(session => session.videoId)).size
    };

    // Calculate detailed watch metrics
    if (watchSessions.length > 0) {
      watchMetrics.totalWatchTimeMinutes = Math.round(
        watchSessions.reduce((sum, session) => sum + (session.actualTimeWatched || 0), 0) / 60
      );

      const totalPercentage = watchSessions.reduce((sum, session) => sum + Number(session.percentageWatched), 0);
      watchMetrics.averageWatchPercentage = Math.round(totalPercentage / watchSessions.length);

      watchSessions.forEach(session => {
        const percentage = Number(session.percentageWatched);
        if (percentage >= 80) {
          watchMetrics.completedVideos++;
        } else if (percentage >= 20) {
          watchMetrics.partiallyWatchedVideos++;
        } else {
          watchMetrics.brieflyWatchedVideos++;
        }
      });
    }

    // Calculate video-specific metrics
    const videoMetrics: Record<string, VideoMetric> = {};
    watchSessions.forEach(session => {
      if (!videoMetrics[session.videoId]) {
        videoMetrics[session.videoId] = {
          videoId: session.videoId,
          videoTitle: session.video.title,
          totalSessions: 0,
          completedSessions: 0,
          totalWatchTimeMinutes: 0,
          averageWatchPercentage: 0,
          lastWatched: null
        };
      }

      const metric = videoMetrics[session.videoId];
      metric.totalSessions++;
      
      const percentage = Number(session.percentageWatched);
      if (percentage >= 80) {
        metric.completedSessions++;
      }
      
      metric.totalWatchTimeMinutes += Math.round(Number(session.actualTimeWatched) / 60);
      metric.averageWatchPercentage = Math.round(
        (metric.averageWatchPercentage * (metric.totalSessions - 1) + percentage) / 
        metric.totalSessions
      );
      
      const sessionDate = new Date(session.startTime);
      if (!metric.lastWatched || sessionDate > metric.lastWatched) {
        metric.lastWatched = sessionDate;
      }
    });

    // Calculate shareable links metrics
    const linkMetrics = shareableLinks.map(link => ({
      id: link.id,
      video: {
        id: link.video.id,
        title: link.video.title
      },
      views: link.views,
      uniqueVisitors: link.engagements.filter(e => e.is_unique_visitor).length,
      createdAt: link.createdAt,
      expirationTime: link.expiration_time,
      totalEngagements: link.engagements.length,
      lastEngagement: link.engagements.length > 0 
        ? new Date(Math.max(...link.engagements.map(e => new Date(e.engagement_time).getTime())))
        : null
    }));

    // Calculate engagement trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const recentWatchSessions = watchSessions.filter(
      session => new Date(session.startTime) >= thirtyDaysAgo
    );

    const recentEngagementTrend = {
      last30Days: {
        totalWatchSessions: recentWatchSessions.length,
        totalWatchTimeMinutes: Math.round(
          recentWatchSessions.reduce((sum, session) => sum + Number(session.actualTimeWatched || 0), 0) / 60
        ),
        averageWatchPercentage: recentWatchSessions.length > 0
          ? Math.round(
              recentWatchSessions.reduce((sum, session) => sum + Number(session.percentageWatched), 0) / 
              recentWatchSessions.length
            )
          : 0,
        uniqueVideosWatched: new Set(recentWatchSessions.map(session => session.videoId)).size
      }
    };

    return successHandler('User engagement data retrieved successfully', {
      sessionStats: {
        ...sessionMetrics,
        engagementRate: sessionMetrics.totalSessions > 0 
          ? Math.round((sessionMetrics.engagedSessions / sessionMetrics.totalSessions) * 100)
          : 0
      },
      watchStats: {
        ...watchMetrics,
        completionRate: watchMetrics.totalWatchSessions > 0
          ? Math.round((watchMetrics.completedVideos / watchMetrics.totalWatchSessions) * 100)
          : 0
      },
      videoSpecificStats: Object.values(videoMetrics),
      shareableLinks: {
        totalLinks: shareableLinks.length,
        totalViews: shareableLinks.reduce((sum, link) => sum + link.views, 0),
        totalUniqueVisitors: shareableLinks.reduce(
          (sum, link) => sum + link.engagements.filter(e => e.is_unique_visitor).length, 
          0
        ),
        links: linkMetrics
      },
      engagementTrends: recentEngagementTrend
    });
  }
}
