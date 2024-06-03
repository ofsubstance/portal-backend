import { Role } from 'src/enums/role.enum';
import { Status } from 'src/enums/status.enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Feedback } from './feedback.entity';
import { VideoPurchase } from './videopurchase.entity';
import { Watchtime } from './watchtime.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 500 })
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: Role.User })
  role: Role;

  @Column({ default: Status.Active })
  status: Status;

  @Column({ nullable: true, default: 0 })
  wallet: number;

  @OneToMany(() => Feedback, (feedback) => feedback.user, { nullable: true })
  feedbacks: Feedback[];

  @OneToMany(() => Watchtime, (watchtime) => watchtime.user, {
    nullable: true,
  })
  watchtimes: Watchtime[];

  @OneToMany(() => VideoPurchase, (videoPurchase) => videoPurchase.user, {
    nullable: true,
  })
  videoPurchases: VideoPurchase[];
}
