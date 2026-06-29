import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { CloudinaryUpload } from 'src/utils/coudinary-upload';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { Video } from '../entities/videos.entity';
import { CreateUpdateVideoDto } from './dto/createUpdateVideo.dto';

// Utility function to normalize URLs by removing spaces
function normalizeUrl(url: string): string {
  if (!url) return url;
  return url.replace(/\s/g, '');
}

@Injectable()
export class VideoService {
  constructor(@InjectRepository(Video) private videoRepo: Repository<Video>) {}

  async findAllVideos() {
    const videos = await this.videoRepo.find();
    return successHandler('Video found', videos);
  }

  async findVideoById(id: string) {
    const video = await this.videoRepo.findOneBy({ id });
    if (!video) throw new NotFoundException('Video not found');
    return successHandler('Video found', video);
  }

  async findVideosByGenre(genre: string) {
    const videos = await this.videoRepo.findBy({ genre: genre });
    return successHandler('Videos found', videos);
  }

  async findVideosByTag(tag: string) {
    const videos = await this.videoRepo
      .createQueryBuilder('video')
      .where(':tag = ANY(video.tags)', { tag: tag })
      .getMany();
    return successHandler('Videos found', videos);
  }

  async searchVideos(keyword: string) {
    const videos = await this.videoRepo
      .createQueryBuilder('video')
      .where('video.title ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.genre ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.short_desc ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.about ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.primary_lesson ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orWhere('video.theme ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('video.impact ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere(':keyword ILIKE ANY(video.tags)', { keyword: keyword })
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

    // Normalize URL fields by removing spaces
    const normalizedAttributes = {
      ...attributes,
      video_url: normalizeUrl(attributes.video_url),
      trailer_url: normalizeUrl(attributes.trailer_url),
      preroll_url: normalizeUrl(attributes.preroll_url),
    };

    const video = this.videoRepo.create({
      ...normalizedAttributes,
      thumbnail_url: thumbnail_url,
    });
    const newVideo = await this.videoRepo.save(video);
    return successHandler('Video created successfully', newVideo);
  }

  async updateVideo(id: string, attributes: Partial<Video>) {
    const video = await this.videoRepo.findOneBy({ id: id });
    if (!video) return errorhandler(404, 'Video not found');
    
    // Normalize URL fields by removing spaces if they exist in the update
    const normalizedAttributes = { ...attributes };
    if (attributes.video_url) {
      normalizedAttributes.video_url = normalizeUrl(attributes.video_url);
    }
    if (attributes.trailer_url) {
      normalizedAttributes.trailer_url = normalizeUrl(attributes.trailer_url);
    }
    if (attributes.preroll_url) {
      normalizedAttributes.preroll_url = normalizeUrl(attributes.preroll_url);
    }
    
    Object.assign(video, normalizedAttributes);
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
    const video = await this.videoRepo.findOneBy({ id });
    if (!video) return errorhandler(404, 'Video not found');
    await this.videoRepo.remove(video);
    return successHandler('Video deleted successfully', null);
  }
}
