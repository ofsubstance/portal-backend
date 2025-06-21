import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserSession } from '../entities/user_sessions.entity';

@Injectable()
export class UserSessionsService {
  private readonly logger = new Logger('UserSessionsService');

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async createSession(userId: string, req: Request): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();

    // Mark previous sessions as inactive in a single query instead of fetching and updating each one
    await this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({
        isActive: false,
        endTime: now,
      })
      .where('userId = :userId AND isActive = :isActive', {
        userId,
        isActive: true,
      })
      .execute();

    this.logger.log(
      `Creating new session ${sessionId} for user ${userId} at ${now.toISOString()}`,
    );

    const session = this.userSessionRepository.create({
      userId,
      sessionId,
      startTime: now,
      lastActiveTime: now,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceInfo: this.getDeviceInfo(req),
      isActive: true,
    });

    const savedSession = await this.userSessionRepository.save(session);
    this.logger.log(`Session ${sessionId} created successfully`);

    return savedSession;
  }

  async updateLastActive(
    sessionId: string,
    req: Request,
  ): Promise<{
    session: UserSession | null;
    newSession?: UserSession;
    status: 'active' | 'expired' | 'renewed';
  }> {
    const session = await this.userSessionRepository.findOne({
      where: { sessionId, isActive: true },
    });

    if (!session) {
      this.logger.warn(`Session ${sessionId} not found or not active`);

      // Try to extract user ID and create a new session
      const userId = this.extractUserIdFromRequest(req);

      if (userId) {
        this.logger.log(
          `Session ${sessionId} expired. Creating new session for user ${userId}`,
        );
        const newSession = await this.createSession(userId, req);
        return { session: null, newSession, status: 'renewed' };
      }

      return { session: null, status: 'expired' };
    }

    const now = new Date();
    const lastActive = new Date(session.lastActiveTime);
    const diffInMinutes = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60),
    );

    this.logger.log(
      `Session ${sessionId} last active ${diffInMinutes} minutes ago`,
    );

    // If last activity was more than 1 hour ago, mark session as inactive
    if (diffInMinutes >= 60) {
      this.logger.log(
        `Session ${sessionId} expired (inactive for ${diffInMinutes} minutes). Ending session.`,
      );

      // Calculate end time as lastActiveTime + 5 minutes for more accurate session duration
      const endTime = new Date(lastActive.getTime() + 5 * 60 * 1000);
      this.logger.log(
        `Setting session end time to lastActiveTime + 5 minutes: ${endTime.toISOString()}`,
      );

      session.isActive = false;
      session.endTime = endTime;
      await this.userSessionRepository.save(session);

      // Try to extract user ID and create a new session
      const userId = this.extractUserIdFromRequest(req);

      if (userId) {
        this.logger.log(`Creating new session for user ${userId} after expiry`);
        const newSession = await this.createSession(userId, req);
        return { session: null, newSession, status: 'renewed' };
      }

      return { session: null, status: 'expired' };
    }

    // Update last active time
    this.logger.log(
      `Updating last active time for session ${sessionId} to ${now.toISOString()}`,
    );
    session.lastActiveTime = now;
    const updatedSession = await this.userSessionRepository.save(session);
    return { session: updatedSession, status: 'active' };
  }

  extractUserIdFromRequest(req: Request): string | null {
    try {
      // Check for JWT token in Authorization header
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET,
        ) as any;

        if (decoded && decoded.id) {
          return decoded.id;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error extracting user ID from request: ${error.message}`,
      );
      return null;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    this.logger.log(`Ending session ${sessionId}`);

    const session = await this.userSessionRepository.findOne({
      where: { sessionId, isActive: true },
    });

    if (!session) {
      this.logger.warn(`Session ${sessionId} not found or already inactive`);
      return;
    }

    session.isActive = false;
    session.endTime = new Date();
    await this.userSessionRepository.save(session);

    this.logger.log(
      `Session ${sessionId} ended at ${session.endTime.toISOString()}`,
    );
  }

  async endActiveSessionsForUser(userId: string): Promise<void> {
    this.logger.log(`Ending all active sessions for user ${userId}`);

    const now = new Date();

    // Use a single query to update all active sessions instead of one by one
    const result = await this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({
        isActive: false,
        endTime: now,
      })
      .where('userId = :userId AND isActive = :isActive', {
        userId,
        isActive: true,
      })
      .execute();

    this.logger.log(
      `Ended ${result.affected || 0} active sessions for user ${userId}`,
    );
  }

  async getActiveSession(sessionId: string): Promise<UserSession> {
    const session = await this.userSessionRepository.findOne({
      where: { sessionId, isActive: true },
    });

    if (!session) {
      this.logger.warn(`Active session ${sessionId} not found`);
      throw new NotFoundException(`Session not found or not active`);
    }

    return session;
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    this.logger.log(`Getting active sessions for user ${userId}`);

    const sessions = await this.userSessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActiveTime: 'DESC' },
    });

    return sessions;
  }

  async getAllActiveSessions(): Promise<UserSession[]> {
    this.logger.log('Getting all active sessions');

    const sessions = await this.userSessionRepository.find({
      where: { isActive: true },
      order: { lastActiveTime: 'DESC' },
    });

    return sessions;
  }

  private getDeviceInfo(req: Request): string {
    try {
      const ua = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = {
        userAgent: ua,
        isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
        browser: this.getBrowserInfo(ua),
        os: this.getOSInfo(ua),
      };
      return JSON.stringify(deviceInfo);
    } catch (error) {
      return 'Unknown device';
    }
  }

  async updateContentEngaged(
    sessionId: string,
    engaged: boolean,
  ): Promise<UserSession> {
    this.logger.log(
      `Updating content engaged status for session ${sessionId} to ${engaged}`,
    );

    const session = await this.getActiveSession(sessionId);
    session.contentEngaged = engaged;

    const updatedSession = await this.userSessionRepository.save(session);
    return updatedSession;
  }

  private getBrowserInfo(ua: string): string {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident'))
      return 'Internet Explorer';
    return 'Unknown';
  }

  private getOSInfo(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod'))
      return 'iOS';
    return 'Unknown';
  }
}
