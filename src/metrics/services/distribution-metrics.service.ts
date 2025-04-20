import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities/user_profiles.entity';
import { successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';

@Injectable()
export class DistributionMetricsService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) {}

  async getUtilizationDistribution() {
    const utilizationStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select('profile.utilization_purpose', 'purpose')
      .addSelect('COUNT(*)', 'count')
      .groupBy('profile.utilization_purpose')
      .getRawMany();

    const totalUsers = utilizationStats.reduce(
      (sum, stat) => sum + parseInt(stat.count),
      0,
    );

    const data = utilizationStats.map((stat) => ({
      purpose: stat.purpose,
      count: parseInt(stat.count),
      percentage:
        Math.round((parseInt(stat.count) / totalUsers) * 100 * 100) / 100,
    }));

    return successHandler(
      'User utilization purpose distribution retrieved successfully',
      {
        totalUsers,
        data,
      },
    );
  }

  async getInterestsDistribution() {
    // Using unnest to handle array of interests
    const interestsStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select('UNNEST(profile.interests)', 'interest')
      .addSelect('COUNT(*)', 'count')
      .groupBy('UNNEST(profile.interests)')
      .getRawMany();

    const totalProfiles = await this.profileRepo.count();

    const data = interestsStats.map((stat) => ({
      interest: stat.interest,
      count: parseInt(stat.count),
      percentage:
        Math.round((parseInt(stat.count) / totalProfiles) * 100 * 100) / 100,
    }));

    // Sort by count in descending order
    data.sort((a, b) => b.count - a.count);

    return successHandler(
      'User interests distribution retrieved successfully',
      {
        totalUsers: totalProfiles,
        data,
      },
    );
  }

  async getInterestsOverlap() {
    // Get pairs of interests that commonly occur together
    const overlapStats = await this.profileRepo
      .createQueryBuilder('profile')
      .select(
        'a.interest as interest1, b.interest as interest2, COUNT(*) as count',
      )
      .innerJoin('UNNEST(profile.interests)', 'a', 'true')
      .innerJoin('UNNEST(profile.interests)', 'b', 'a.interest < b.interest')
      .groupBy('a.interest, b.interest')
      .having('COUNT(*) > 1')
      .orderBy('COUNT(*)', 'DESC')
      .limit(20)
      .getRawMany();

    const totalProfiles = await this.profileRepo.count();

    const data = overlapStats.map((stat) => ({
      combination: [stat.interest1, stat.interest2],
      count: parseInt(stat.count),
      percentage:
        Math.round((parseInt(stat.count) / totalProfiles) * 100 * 100) / 100,
    }));

    return successHandler(
      'User interests overlap analysis retrieved successfully',
      {
        totalUsers: totalProfiles,
        data,
      },
    );
  }
}
