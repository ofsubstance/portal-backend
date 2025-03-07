import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';

@Entity()
export class LoginEvent extends BaseEntity {
  @ManyToOne(() => User, (user) => user.loginEvents)
  user: User;

  @Column()
  userId: string;

  @Column()
  timestamp: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ default: 'credentials' })
  loginMethod: string; // 'credentials', 'google', etc.

  @Column({ default: true })
  successful: boolean;

  @Column({ nullable: true })
  failureReason: string;
}
