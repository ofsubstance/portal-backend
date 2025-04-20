import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'The ID of the video being reviewed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({
    description: 'User engagement level with the content (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  engagementLevel: number;

  @ApiProperty({
    description: 'How useful the subject matter was to the user (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  subjectMatterUsefulness: number;

  @ApiProperty({
    description: "How much the content improved the user's outcome (1-5)",
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  outcomeImprovement: number;

  @ApiProperty({
    description: 'Likelihood of user continuing to use the platform (1-5)',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  continueUsageLikelihood: number;

  @ApiProperty({
    description: 'Likelihood of user recommending the platform to others (1-5)',
    example: 1,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  recommendLikelihood: number;

  @ApiProperty({
    description: 'Open-ended user feedback comments',
    example: 'Really great film. I thoroughly enjoyed it.',
  })
  @IsString()
  @IsOptional()
  openEndedFeedback?: string;
}
