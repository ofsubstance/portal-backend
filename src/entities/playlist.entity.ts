import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Video } from './video.entity';

@Entity()
export class Playlist extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  tag: string;

  @ManyToMany(() => Video, (video) => video.playlists, { cascade: true })
  @JoinTable()
  videos: Video[];
}
