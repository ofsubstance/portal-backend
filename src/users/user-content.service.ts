import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { Feedback } from 'src/entities/feedbacks.entity';
import { ShareableLink } from 'src/entities/sharable_links.entity';
import { User } from 'src/entities/users.entity';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';

@Injectable()
export class UserContentService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Feedback) private feedbackRepo: Repository<Feedback>,
    @InjectRepository(ShareableLink)
    private shareLinkRepo: Repository<ShareableLink>,
  ) {}

  async getUserProfile(userId: string) {
    // Validate user exists and get user with profile
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      return errorhandler(404, 'User not found');
    }

    // Create a sanitized response object without sensitive information
    const userProfile = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            business_name: user.profile.business_name,
            website: user.profile.website,
            state_region: user.profile.state_region,
            country: user.profile.country,
            utilization_purpose: user.profile.utilization_purpose,
            interests: user.profile.interests,
          }
        : null,
    };

    return successHandler('User profile retrieved successfully', userProfile);
  }

  async getUserComments(userId: string) {
    // Validate user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      return errorhandler(404, 'User not found');
    }

    // Fetch all comments made by this user with video details
    const comments = await this.commentRepo.find({
      where: { user: { id: userId } },
      relations: ['video'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        text: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        video: {
          id: true,
          title: true,
          thumbnail_url: true,
        },
      },
    });

    if (comments.length === 0) {
      return successHandler('No comments found for this user', []);
    }

    return successHandler('User comments retrieved successfully', comments);
  }

  async getUserFeedbacks(userId: string) {
    // Validate user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      return errorhandler(404, 'User not found');
    }

    // Fetch all feedbacks submitted by this user with video details
    const feedbacks = await this.feedbackRepo.find({
      where: { user: { id: userId } },
      relations: ['video'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        engagementLevel: true,
        subjectMatterUsefulness: true,
        outcomeImprovement: true,
        continueUsageLikelihood: true,
        recommendLikelihood: true,
        openEndedFeedback: true,
        createdAt: true,
        video: {
          id: true,
          title: true,
          thumbnail_url: true,
        },
      },
    });

    if (feedbacks.length === 0) {
      return successHandler('No feedbacks found for this user', []);
    }

    return successHandler('User feedbacks retrieved successfully', feedbacks);
  }

  async getUserShareableLinks(userId: string) {
    // Validate user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      return errorhandler(404, 'User not found');
    }

    // Fetch all shareable links created by this user with video details
    const shareableLinks = await this.shareLinkRepo.find({
      where: { user: { id: userId } },
      relations: ['video'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        unique_link: true,
        unique_link_id: true,
        createdAt: true,
        expiration_time: true,
        views: true,
        video: {
          id: true,
          title: true,
          thumbnail_url: true,
        },
      },
    });

    if (shareableLinks.length === 0) {
      return successHandler('No shareable links found for this user', []);
    }

    return successHandler(
      'User shareable links retrieved successfully',
      shareableLinks,
    );
  }
}
