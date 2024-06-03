import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';
import { Video } from './video.entity';

@Entity()
export class VideoPurchase extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.videoPurchases)
  video: Video;

  @ManyToOne(() => User, (user) => user.videoPurchases)
  user: User;
}
