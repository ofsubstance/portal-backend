import { Role } from 'src/enums/role.enum';
import { Status } from 'src/enums/status.enum';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
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
  @JoinColumn() // This is the owning side of the relationship
  profile: Profile;
}
