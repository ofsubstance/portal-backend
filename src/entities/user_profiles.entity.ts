import { Utilization } from 'src/enums/utilization.enum';
import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './users.entity';

@Entity()
export class Profile extends BaseEntity {
  @Column({ length: 500 })
  business_name: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  state_region: string;

  @Column({ nullable: true })
  country: string;

  @Column()
  utilization_purpose: Utilization;

  @Column('text', { array: true })
  interests: string[];

  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
