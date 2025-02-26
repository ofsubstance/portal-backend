import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ShareableLink } from './sharable_links.entity';

@Entity('shareable_link_engagements')
export class ShareableLinkEngagement extends BaseEntity {
  @ManyToOne(
    () => ShareableLink,
    (shareableLink) => shareableLink.engagements,
    {
      onDelete: 'CASCADE',
    },
  )
  shareableLink: ShareableLink;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer: string;

  @Column({ default: false })
  is_unique_visitor: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  engagement_time: Date;
}
