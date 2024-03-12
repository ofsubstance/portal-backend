import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../utils/base.entity';
import { Video } from './video.entity';

@Entity()
export class Playlist extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Video)
  @JoinTable()
  videos: Video[];
}
