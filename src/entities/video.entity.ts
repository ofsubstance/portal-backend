import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Download } from './download.entity';
import { Feedback } from './feedback.entity';
import { VideoPurchase } from './videopurchase.entity';
import { Watchtime } from './watchtime.entity';

@Entity()
export class Video extends BaseEntity {
  @Column()
  video_url: string;

  @Column()
  thumbnail_url: string;

  @Column({ length: 500 })
  title: string;

  @Column('text', { array: true })
  genre: string;

  @Column()
  duration: string;

  @Column({ nullable: true })
  short_desc: string;

  @Column({ nullable: true })
  about: string;

  @Column({ nullable: true })
  primary_lesson: string;

  @Column({ nullable: true })
  theme: string;

  @Column({ nullable: true })
  impact: string;

  @Column({ nullable: true, default: 0 })
  cost: number;

  @OneToMany(() => Watchtime, (watchtime) => watchtime.video, {
    nullable: true,
  })
  watchtimes: Watchtime[];

  @OneToMany(() => Download, (download) => download.video, { nullable: true })
  downloads: Download[];

  @OneToMany(() => Feedback, (feedback) => feedback.video, { nullable: true })
  feedbacks: Feedback[];

  @OneToMany(() => VideoPurchase, (videoPurchase) => videoPurchase.video, {
    nullable: true,
  })
  videoPurchases: VideoPurchase[];
}
