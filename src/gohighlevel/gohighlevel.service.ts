import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SignUpDto } from 'src/auth/dto/signup.dto';

@Injectable()
export class GoHighLevelService {
  private readonly logger = new Logger(GoHighLevelService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly locationId: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('GHL_API_URL');
    this.apiKey = this.configService.get<string>('GHL_API_KEY');
    this.locationId = this.configService.get<string>('GHL_LOCATION_ID');
  }

  async createContact(signUpData: SignUpDto) {
    try {
      const contactData = {
        email: signUpData.email,
        phone: signUpData.phone,
        firstName: signUpData.firstname,
        lastName: signUpData.lastname,
        name: `${signUpData.firstname} ${signUpData.lastname}`,
        address1: '',
        city: '',
        state: signUpData.profile.stateRegion,
        country: signUpData.profile.country,
        postalCode: '',
        website: signUpData.profile.website,
        tags: ['OF Substance Signup'],
        source: 'OF Substance Platform',
        customField: {
          business_name: signUpData.profile.businessName,
          utilization_purpose: signUpData.profile.utilizationPurpose,
          interests: signUpData.profile.interests.join(','),
          smsConsent: signUpData.smsConsent ? 'Yes' : 'No',
          emailConsent: signUpData.emailTermsConsent ? 'Yes' : 'No',
        },
      };

      const response = await axios.post(
        `${this.apiUrl}contacts/`,
        contactData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        `Contact created successfully in GoHighLevel: ${response.data.contact.id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error creating contact in GoHighLevel: ${error.message}`,
        error.stack,
      );
      // We don't want to fail the signup process if GHL integration fails
      // Just log the error and continue
      return null;
    }
  }
}
