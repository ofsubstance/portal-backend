import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';
import { Video } from './videos.entity';

@Entity()
export class Feedback extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.feedbacks)
  video: Video;

  @ManyToOne(() => User, (user) => user.feedbacks, { nullable: true })
  user: User;

  @Column({ nullable: true })
  engagementLevel: number;

  @Column({ nullable: true })
  subjectMatterUsefulness: number;

  @Column({ nullable: true })
  outcomeImprovement: number;

  @Column({ nullable: true })
  continueUsageLikelihood: number;

  @Column({ nullable: true })
  recommendLikelihood: number;

  @Column({ type: 'text', nullable: true })
  openEndedFeedback: string;
}
