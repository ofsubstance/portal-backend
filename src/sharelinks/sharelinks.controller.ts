import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { CreateShareLinkDto } from './createShareLink.dto';
import { SharelinksService } from './sharelinks.service';
import { TrackLinkEngagementDto } from './trackLinkEngagement.dto';

@Catch()
@ApiTags('Shareable Links')
@Controller('sharelinks')
export class SharelinksController {
  constructor(private sharelinksService: SharelinksService) {}

  @Roles(Role.Admin)
  @Get()
  async getAllShareLinks() {
    return await this.sharelinksService.getAllShareLinks();
  }

  @Roles(Role.Admin)
  @Get('analytics/all')
  async getAllLinkAnalytics() {
    return await this.sharelinksService.getAllShareLinks();
  }

  @Roles(Role.Admin)
  @Get('analytics/comprehensive')
  async getComprehensiveAnalytics() {
    return await this.sharelinksService.getComprehensiveAnalytics();
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async deleteShareLink(@Param('id') id: string) {
    return await this.sharelinksService.deleteShareLink(id);
  }

  @Post()
  async createShareLink(
    @Body() createShareLinkDto: CreateShareLinkDto,
    @Req() request: any,
  ) {
    const userId = request.user.id;
    return await this.sharelinksService.createShareLink(
      createShareLinkDto,
      userId,
    );
  }

  @Get('analytics/user/:userId')
  async getUserLinkAnalytics(@Param('userId') userId: string) {
    return await this.sharelinksService.getUserLinkAnalytics(userId);
  }

  @Get('analytics/:linkId')
  async getLinkAnalytics(@Param('linkId') linkId: string) {
    return await this.sharelinksService.getLinkAnalytics(linkId);
  }

  @Get('unique/:uniqueLink')
  async findShareLinkByUniqueLink(@Param('uniqueLink') uniqueLink: string) {
    return await this.sharelinksService.getShareLinkByUniqueLink(uniqueLink);
  }

  @Get('unique-id/:uniqueLinkId')
  async findShareLinkByUniqueLinkId(
    @Param('uniqueLinkId') uniqueLinkId: string,
  ) {
    return await this.sharelinksService.getShareLinkByUniqueLinkId(
      uniqueLinkId,
    );
  }

  @Get('user/:userId')
  async findShareLinkByUser(@Param('userId') userId: string) {
    return await this.sharelinksService.getShareLinkByUserId(userId);
  }

  @Get(':id')
  async findShareLinkById(@Param('id') id: string) {
    return await this.sharelinksService.getShareLinkById(id);
  }

  @Put('track/:uniqueLink')
  async trackLinkEngagement(
    @Param('uniqueLink') uniqueLink: string,
    @Body() trackLinkEngagementDto: TrackLinkEngagementDto,
    @Req() request: any,
  ) {
    // Get the client's IP address from the request
    const ip = this.getClientIp(request);

    // Create a new DTO with the IP address from the request
    const updatedDto = {
      ...trackLinkEngagementDto,
      ip_address: ip,
    };

    return await this.sharelinksService.trackLinkEngagement(
      uniqueLink,
      updatedDto,
    );
  }

  @Public()
  @Put('track-id/:uniqueLinkId')
  async trackLinkEngagementById(
    @Param('uniqueLinkId') uniqueLinkId: string,
    @Body() trackLinkEngagementDto: TrackLinkEngagementDto,
    @Req() request: any,
  ) {
    // Get the client's IP address from the request
    const ip = this.getClientIp(request);

    // Create a new DTO with the IP address from the request
    const updatedDto = {
      ...trackLinkEngagementDto,
      ip_address: ip,
    };

    return await this.sharelinksService.trackLinkEngagementById(
      uniqueLinkId,
      updatedDto,
    );
  }

  // Helper method to extract client IP address
  private getClientIp(request: any): string {
    // Check for X-Forwarded-For header (common when behind a proxy/load balancer)
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = xForwardedFor.split(',');
      return ips[0].trim();
    }

    // Check for other common headers
    if (request.headers['x-real-ip']) {
      return request.headers['x-real-ip'];
    }

    // Fall back to the remote address from the connection
    return (
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      '0.0.0.0'
    );
  }
}
