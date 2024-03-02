import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../utils/base.entity';

@Entity()
export class Video extends BaseEntity {
  @Column({ length: 500 })
  title: string;

  @Column()
  genre: string;

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
  // @OneToMany(() => Booking, (booking) => booking.client)
  // bookings: Booking[];
}
