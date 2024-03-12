import { Viewer } from 'src/entities/viewer.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../utils/base.entity';
import { Video } from './video.entity';

@Entity()
export class Watchtime extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.watchtimes)
  video: Video;

  @ManyToOne(() => Viewer, (viewer) => viewer.watchtimes)
  viewer: Viewer;

  @Column({ nullable: true })
  watchtime: number;
}
