import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Feedback } from 'src/entities/feedbacks.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Video) private videoRepository: Repository<Video>,
  ) {}

  async createFeedback(userId: string, createFeedbackDto: CreateFeedbackDto) {
    try {
      // Find the user
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return errorhandler(404, 'User not found');
      }

      // Find the video
      const video = await this.videoRepository.findOneBy({
        id: createFeedbackDto.videoId,
      });
      if (!video) {
        return errorhandler(404, 'Video not found');
      }

      // Create and save the feedback
      const feedback = this.feedbackRepository.create({
        user,
        video,
        engagementLevel: createFeedbackDto.engagementLevel,
        subjectMatterUsefulness: createFeedbackDto.subjectMatterUsefulness,
        outcomeImprovement: createFeedbackDto.outcomeImprovement,
        continueUsageLikelihood: createFeedbackDto.continueUsageLikelihood,
        recommendLikelihood: createFeedbackDto.recommendLikelihood,
        openEndedFeedback: createFeedbackDto.openEndedFeedback,
      });

      const savedFeedback = await this.feedbackRepository.save(feedback);
      return successHandler('Feedback submitted successfully', savedFeedback);
    } catch (error) {
      return errorhandler(500, `Failed to submit feedback: ${error.message}`);
    }
  }

  async getFeedbackById(id: string) {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id },
        relations: ['user', 'video'],
      });

      if (!feedback) {
        return errorhandler(404, 'Feedback not found');
      }

      return successHandler('Feedback retrieved successfully', feedback);
    } catch (error) {
      return errorhandler(500, `Failed to retrieve feedback: ${error.message}`);
    }
  }

  async getFeedbacksByVideo(videoId: string) {
    try {
      const feedbacks = await this.feedbackRepository.find({
        where: {
          video: { id: videoId },
        },
        relations: ['user'],
      });

      return successHandler('Feedbacks retrieved successfully', feedbacks);
    } catch (error) {
      return errorhandler(
        500,
        `Failed to retrieve feedbacks: ${error.message}`,
      );
    }
  }

  async getFeedbacksByUser(userId: string) {
    try {
      const feedbacks = await this.feedbackRepository.find({
        where: {
          user: { id: userId },
        },
        relations: ['video'],
        order: { createdAt: 'DESC' },
      });

      if (feedbacks.length === 0) {
        return successHandler('No feedbacks found for this user', []);
      }

      return successHandler('User feedbacks retrieved successfully', feedbacks);
    } catch (error) {
      return errorhandler(
        500,
        `Failed to retrieve user feedbacks: ${error.message}`,
      );
    }
  }
}
