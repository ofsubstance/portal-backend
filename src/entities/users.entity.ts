import { Role } from 'src/enums/role.enum';
import { Status } from 'src/enums/status.enum';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Comment } from './comments.entity';
import { Feedback } from './feedbacks.entity';
import { LoginEvent } from './login_events.entity';
import { ShareableLink } from './sharable_links.entity';
import { Profile } from './user_profiles.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 500 })
  firstname: string;

  @Column({ length: 500 })
  lastname: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ nullable: true })
  first_content_engagement: Date;

  @Column({ default: Role.User })
  role: Role;

  @Column({ default: Status.Unverified })
  status: Status;

  @Column({ default: false })
  sms_consent: boolean;

  @Column({ default: false })
  email_consent: boolean;

  @Column({ nullable: true })
  email_verification_token: string;

  @Column({ nullable: true })
  reset_pass_token: string;

  @Column({ nullable: true })
  reset_pass_token_expiry: Date;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Feedback, (feedback) => feedback.user, { nullable: true })
  feedbacks: Feedback[];

  @OneToMany(() => Comment, (comment) => comment.user, { nullable: true })
  comments: Comment[];

  @OneToMany(() => ShareableLink, (link) => link.user)
  shareableLinks: ShareableLink[];

  @OneToMany(() => LoginEvent, (loginEvent) => loginEvent.user)
  loginEvents: LoginEvent[];
}
