import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { CloudinaryUpload } from 'src/utils/coudinary-upload';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { Video } from '../entities/video.entity';
import { CreateUpdateVideoDto } from './dto/createUpdateVideo.dto';

@Injectable()
export class VideoService {
  constructor(@InjectRepository(Video) private videoRepo: Repository<Video>) {}

  async findAllVideos() {
    const videos = await this.videoRepo.find();
    return successHandler('Video found', videos);
  }

  async findVideoById(id: string) {
    const video = await this.videoRepo.findOneBy({ id: id });
    return successHandler('Video found', video);
  }

  // async findPurchasedVideos(userId: string) {
  //   const vidsPurchased = await this.videoPurchaseRepo.find({
  //     relations: ['user', 'video'],
  //     where: {
  //       user: {
  //         id: userId,
  //       },
  //     },
  //   });

  //   const videosPurchased = vidsPurchased.map((purchase) => purchase.video);

  //   const vidoes = await this.videoRepo.find();

  //   const lockedVideos = vidoes.filter(
  //     (video) => !videosPurchased.includes(video),
  //   );

  //   return successHandler('Videos found', {
  //     purchasedVideos: [],
  //     lockedVideos: [],
  //   });
  // }

  async findVideosByGenre(genre: string) {
    const videos = await this.videoRepo.findBy({ genre: genre });
    return successHandler('Videos found', videos);
  }

  // async findVideosUnlocked(viewerId: string) {
  //   const videos = await this.videoRepo
  //     .createQueryBuilder('video')
  //     .leftJoin('video.videoPurchases', 'videoPurchases')
  //     .leftJoin('videoPurchases.viewer', 'viewer')
  //     .where('viewer.id = :viewerId', { viewerId: viewerId })
  //     .getMany();
  //   return successHandler('Videos found', videos);
  // }

  // async findVideosLocked(viewerId: string) {
  //   const allVideos = await this.videoRepo.find();
  //   const unlockedVideos = await this.videoRepo
  //     .createQueryBuilder('video')
  //     .leftJoin('video.videoPurchases', 'videoPurchases')
  //     .leftJoin('videoPurchases.viewer', 'viewer')
  //     .where('viewer.id = :viewerId', { viewerId: viewerId })
  //     .getMany();
  //   const lockedVideos = allVideos.filter(
  //     (video) => !unlockedVideos.includes(video),
  //   );
  //   return successHandler('Videos found', lockedVideos);
  // }

  async searchVideos(keyword: string) {
    const videos = await this.videoRepo
      .createQueryBuilder('video')
      .where('video.title LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.genre LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.short_desc LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.about LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.primary_lesson LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orWhere('video.theme LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.impact LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();
    return successHandler('Videos found', videos);
  }

  async createVideo(
    thumbnail: Express.Multer.File,
    attributes: CreateUpdateVideoDto,
  ) {
    const cloudinaryUpload = await CloudinaryUpload(
      thumbnail,
      'thumbnails',
      randomUUID(),
    );

    const thumbnail_url = cloudinaryUpload.secure_url;

    const video = this.videoRepo.create({
      ...attributes,
      thumbnail_url: thumbnail_url,
    });
    const newVideo = await this.videoRepo.save(video);
    return successHandler('Video created successfully', newVideo);
  }

  async updateVideo(id: string, attributes: Partial<Video>) {
    const video = await this.videoRepo.findOneBy({ id: id });
    if (!video) return errorhandler(404, 'Video not found');
    console.log(video, attributes);
    Object.assign(video, attributes);
    const updatedVideo = await this.videoRepo.save(video);
    return successHandler('Video updated successfully', updatedVideo);
  }

  async updateVideoThumbnail(thumbnail: Express.Multer.File, videoId: string) {
    const video = await this.videoRepo.findOneBy({ id: videoId });
    if (!video) return errorhandler(404, 'Video not found');

    const cloudinaryUpload = await CloudinaryUpload(
      thumbnail,
      'thumbnails',
      randomUUID(),
    );

    const thumbnail_url = cloudinaryUpload.secure_url;

    video.thumbnail_url = thumbnail_url;
    const updatedVideo = await this.videoRepo.save(video);
    return successHandler('Video thumbnail updated successfully', updatedVideo);
  }

  async deleteVideo(id: string) {
    const video = await this.videoRepo.findBy({ id: id });
    if (!video) return errorhandler(404, 'Video not found');
    await this.videoRepo.remove(video);
    return successHandler('Video deleted successfully', null);
  }
}
