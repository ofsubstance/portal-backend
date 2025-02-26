import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ShareableLinkEngagement } from './shareable_link_engagements.entity';
import { User } from './users.entity';
import { Video } from './videos.entity';

@Entity('shareable_links')
export class ShareableLink extends BaseEntity {
  @Column()
  expiration_time: Date;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  unique_link: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  unique_link_id: string;

  @ManyToOne(() => User, (user) => user.shareableLinks)
  user: User;

  @ManyToOne(() => Video, (video) => video.shareableLinks)
  video: Video;

  @OneToMany(
    () => ShareableLinkEngagement,
    (engagement) => engagement.shareableLink,
  )
  engagements: ShareableLinkEngagement[];
}
