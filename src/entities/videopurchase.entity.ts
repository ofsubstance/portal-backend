import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../utils/base.entity';
import { Video } from './video.entity';
import { Viewer } from './viewer.entity';

@Entity()
export class VideoPurchase extends BaseEntity {
  @ManyToOne(() => Video, (video) => video.videoPurchases)
  video: Video;

  @ManyToOne(() => Viewer, (viewer) => viewer.videoPurchases)
  viewer: Viewer;
}
