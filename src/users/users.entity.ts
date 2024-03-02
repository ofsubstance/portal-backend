import { role, status } from 'src/utils/constants';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../utils/base.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 500 })
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: role.user })
  role: string;

  @Column({ default: status.active })
  status: string;

  // @OneToMany(() => Booking, (booking) => booking.client)
  // bookings: Booking[];
}
