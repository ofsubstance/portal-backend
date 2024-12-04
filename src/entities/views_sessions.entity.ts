// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// import { Users } from './users.entity';
// import { Videos } from './videos.entity';
// import { BaseEntity } from './base.entity';

// @Entity('view_sessions')
// export class ViewSessions extends BaseEntity {
//   @Column()
//   start_time: Date;

//   @Column({ nullable: true })
//   end_time: Date;

//   @Column({ type: 'float', nullable: true })
//   watched_duration: number;

//   @ManyToOne(() => Users, (user) => user.view_sessions, { nullable: true })
//   user: Users;

//   @ManyToOne(() => Videos, (video) => video.view_sessions)
//   video: Videos;
// }
