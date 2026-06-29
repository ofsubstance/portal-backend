import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { GoHighLevelService } from '../gohighlevel/gohighlevel.service';
import { User } from '../entities/users.entity';
import { Video } from '../entities/videos.entity';
import { WatchSession } from '../entities/watch_sessions.entity';
import { CreateWatchSessionDto } from './dto/create-watch-session.dto';
import { UpdateWatchSessionDto } from './dto/update-watch-session.dto';

const CONTENT_COMPLETION_THRESHOLD = 80;

@Injectable()
export class WatchSessionsService {
  constructor(
    @InjectRepository(WatchSession)
    private watchSessionRepository: Repository<WatchSession>,
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private goHighLevelService: GoHighLevelService,
  ) {}

  async createWatchSession(
    createWatchSessionDto: CreateWatchSessionDto,
  ): Promise<WatchSession> {
    const video = await this.videoRepository.findOneBy({
      id: createWatchSessionDto.videoId,
    });

    if (!video) {
      throw new NotFoundException(
        `Video with ID ${createWatchSessionDto.videoId} not found`,
      );
    }

    const entityData: DeepPartial<WatchSession> = { ...createWatchSessionDto };
    const watchSession = this.watchSessionRepository.create(entityData);
    return this.watchSessionRepository.save(watchSession);
  }

  async updateWatchSession(
    id: string,
    updateWatchSessionDto: UpdateWatchSessionDto,
  ): Promise<WatchSession> {
    const watchSession = await this.findWatchSessionById(id);

    const entityData: DeepPartial<WatchSession> = { ...updateWatchSessionDto };
    Object.assign(watchSession, entityData);
    const saved = await this.watchSessionRepository.save(watchSession);

    if (
      !saved.isGuestWatchSession &&
      saved.percentageWatched >= CONTENT_COMPLETION_THRESHOLD &&
      saved.userSession?.userId
    ) {
      const user = await this.userRepository.findOne({
        where: { id: saved.userSession.userId },
      });
      if (user) {
        const contentLink = `${process.env.FRONTEND_URL}/video/${saved.video.id}`;
        this.goHighLevelService
          .trackContentCompleted(user.email, saved.video.title, contentLink)
          .catch(() => {});
      }
    }

    return saved;
  }

  async findAllWatchSessions(): Promise<WatchSession[]> {
    return this.watchSessionRepository.find({
      relations: ['video'],
    });
  }

  async findWatchSessionById(id: string): Promise<WatchSession> {
    const watchSession = await this.watchSessionRepository.findOne({
      where: { id },
      relations: ['video', 'userSession'],
    });

    if (!watchSession) {
      throw new NotFoundException(`Watch session with ID ${id} not found`);
    }

    return watchSession;
  }

  async findWatchSessionsByUserSessionId(
    userSessionId: string,
  ): Promise<WatchSession[]> {
    return this.watchSessionRepository.find({
      where: { userSessionId },
      relations: ['video'],
    });
  }

  async findWatchSessionsByUserId(userId: string): Promise<WatchSession[]> {
    return this.watchSessionRepository
      .createQueryBuilder('watchSession')
      .innerJoinAndSelect('watchSession.video', 'video')
      .innerJoin('watchSession.userSession', 'userSession')
      .where('userSession.userId = :userId', { userId })
      .andWhere('watchSession.isGuestWatchSession = :isGuest', {
        isGuest: false,
      })
      .orderBy('watchSession.startTime', 'DESC')
      .getMany();
  }

  async deleteWatchSession(id: string): Promise<void> {
    const result = await this.watchSessionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Watch session with ID ${id} not found`);
    }
  }
}
