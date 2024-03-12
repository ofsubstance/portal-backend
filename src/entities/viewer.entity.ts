import { Feedback } from 'src/entities/feedback.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Download } from './download.entity';
import { User } from './users.entity';
import { VideoPurchase } from './videopurchase.entity';
import { Watchtime } from './watchtime.entity';

@Entity()
export class Viewer extends User {
  @Column({ nullable: true, default: 0 })
  wallet: number;

  @OneToMany(() => Feedback, (feedback) => feedback.viewer, { nullable: true })
  feedbacks: Feedback[];

  @OneToMany(() => Download, (download) => download.viewer, { nullable: true })
  downloads: Download[];

  @OneToMany(() => Watchtime, (watchtime) => watchtime.viewer, {
    nullable: true,
  })
  watchtimes: Watchtime[];

  @OneToMany(() => VideoPurchase, (videoPurchase) => videoPurchase.viewer, {
    nullable: true,
  })
  videoPurchases: VideoPurchase[];
}
