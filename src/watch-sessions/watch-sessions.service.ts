import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { WatchSession } from '../entities/watch_sessions.entity';
import { CreateWatchSessionDto } from './dto/create-watch-session.dto';
import { UpdateWatchSessionDto } from './dto/update-watch-session.dto';

@Injectable()
export class WatchSessionsService {
  constructor(
    @InjectRepository(WatchSession)
    private watchSessionRepository: Repository<WatchSession>,
  ) {}

  async createWatchSession(
    createWatchSessionDto: CreateWatchSessionDto,
  ): Promise<WatchSession> {
    const entityData: DeepPartial<WatchSession> = {
      ...createWatchSessionDto,
    };

    const watchSession = this.watchSessionRepository.create(entityData);
    return this.watchSessionRepository.save(watchSession);
  }

  async updateWatchSession(
    id: string,
    updateWatchSessionDto: UpdateWatchSessionDto,
  ): Promise<WatchSession> {
    const watchSession = await this.findWatchSessionById(id);

    if (!watchSession) {
      throw new NotFoundException(`Watch session with ID ${id} not found`);
    }

    const entityData: DeepPartial<WatchSession> = {
      ...updateWatchSessionDto,
    };

    Object.assign(watchSession, entityData);
    return this.watchSessionRepository.save(watchSession);
  }

  async findAllWatchSessions(): Promise<WatchSession[]> {
    return this.watchSessionRepository.find({
      relations: ['video'],
    });
  }

  async findWatchSessionById(id: string): Promise<WatchSession> {
    const watchSession = await this.watchSessionRepository.findOne({
      where: { id },
      relations: ['video'],
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
      .where(
        'watchSession.userSessionId IN (SELECT id FROM user_session WHERE userId = :userId)',
        { userId },
      )
      .getMany();
  }

  async deleteWatchSession(id: string): Promise<void> {
    const result = await this.watchSessionRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Watch session with ID ${id} not found`);
    }
  }
}
