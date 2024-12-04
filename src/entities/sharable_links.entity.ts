import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { Video } from './videos.entity';
// import { ShareableLinkEngagements } from './shareable_link_engagements.entity';
import { BaseEntity } from './base.entity';

@Entity('shareable_links')
export class ShareableLink extends BaseEntity {
  @Column()
  expiration_time: Date;

  @Column({ default: 0 })
  views: number;

  @ManyToOne(() => User, (user) => user.shareableLinks)
  user: User;

  @ManyToOne(() => Video, (video) => video.shareableLinks)
  video: Video;
}
