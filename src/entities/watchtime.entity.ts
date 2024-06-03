import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';
import { Video } from './video.entity';

@Entity()
export class Watchtime extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.watchtimes)
  video: Video;

  @ManyToOne(() => User, (user) => user.watchtimes)
  user: User;

  @Column({ nullable: true })
  watchtime: number;
}
