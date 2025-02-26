import { CommentStatus } from 'src/enums/comment-status.enum';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';
import { Video } from './videos.entity';

@Entity()
export class Comment extends BaseEntity {
  @Column('text')
  text: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.Pending,
  })
  status: CommentStatus;

  @ManyToOne(() => Video, (video) => video.comments)
  video: Video;

  @ManyToOne(() => User, (user) => user.comments)
  user: User;
}
