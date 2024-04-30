import { Viewer } from 'src/entities/viewer.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Video } from './video.entity';

@Entity()
export class Download extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.downloads)
  video: Video;

  @ManyToOne(() => Viewer, (viewer) => viewer.downloads)
  viewer: Viewer;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  platform_feedback: string;

  @Column({ nullable: true })
  improvements: string;

  @Column({ nullable: true })
  video_comment: string;

  @Column({ default: false })
  approved: boolean;
}
