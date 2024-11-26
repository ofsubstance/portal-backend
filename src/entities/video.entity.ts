import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
// import { Feedback } from './feedback.entity';
// import { Playlist } from './playlist.entity';
// import { VideoPurchase } from './videopurchase.entity';
// import { Watchtime } from './watchtime.entity';

@Entity()
export class Video extends BaseEntity {
  @Column()
  video_url: string;

  @Column()
  trailer_url: string;

  @Column()
  thumbnail_url: string;

  @Column({ length: 500 })
  title: string;

  @Column('text')
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

  // @OneToMany(() => Watchtime, (watchtime) => watchtime.video, {
  //   nullable: true,
  // })
  // watchtimes: Watchtime[];

  // @OneToMany(() => Feedback, (feedback) => feedback.video, { nullable: true })
  // feedbacks: Feedback[];

  // @OneToMany(() => VideoPurchase, (videoPurchase) => videoPurchase.video, {
  //   nullable: true,
  // })
  // videoPurchases: VideoPurchase[];

  // @ManyToMany(() => Playlist, (playlist) => playlist.videos)
  // playlists: Playlist[];
}
