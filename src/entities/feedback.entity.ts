import { Viewer } from 'src/entities/viewer.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Video } from './video.entity';

@Entity()
export class Feedback extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.feedbacks)
  video: Video;

  @ManyToOne(() => Viewer, (viewer) => viewer.feedbacks)
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
