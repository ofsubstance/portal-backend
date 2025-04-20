import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Video } from './videos.entity';

@Entity('watch_sessions')
export class WatchSession extends BaseEntity {
  // @ManyToOne(() => UserSession, { nullable: true })
  // @JoinColumn({ name: 'userSessionId' })
  // userSession: UserSession;

  @Column({ nullable: true })
  userSessionId: string;

  @Column({ default: false })
  isGuestWatchSession: boolean;

  @ManyToOne(() => Video, { nullable: true })
  @JoinColumn({ name: 'videoId' })
  video: Video;

  @Column()
  videoId: string;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  actualTimeWatched: number;

  //percentageWatched
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentageWatched: number;

  //user event json
  @Column({ type: 'jsonb', nullable: true })
  userEvent: UserEvent[];

  //user metadata json
  @Column({ type: 'jsonb', nullable: true })
  userMetadata: UserMetadata;
}

export interface UserEvent {
  event: string;
  eventTime: Date;
  videoTime: number;
}

export interface UserMetadata {
  userAgent: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  deviceType: string;
}
