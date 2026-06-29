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

  private async lookupContactByEmail(email: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.apiUrl}contacts/lookup?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Version: '2021-07-28',
          },
        },
      );
      return response.data?.contact?.id ?? null;
    } catch {
      return null;
    }
  }

  private async updateContactFields(
    contactId: string,
    customField: Record<string, string>,
  ): Promise<void> {
    await axios.put(
      `${this.apiUrl}contacts/${contactId}`,
      { customField },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async trackUserLoggedIn(email: string): Promise<void> {
    try {
      const contactId = await this.lookupContactByEmail(email);
      if (!contactId) return;
      await this.updateContactFields(contactId, {
        last_login_date: new Date().toISOString(),
      });
      this.logger.log(`Tracked user_logged_in in GHL for: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error tracking user_logged_in in GHL: ${error.message}`,
      );
    }
  }

  async trackContentCompleted(
    email: string,
    contentTitle: string,
    contentLink: string,
  ): Promise<void> {
    try {
      const contactId = await this.lookupContactByEmail(email);
      if (!contactId) return;
      await this.updateContactFields(contactId, {
        last_content_engagement_date: new Date().toISOString(),
        last_content_engaged_title: contentTitle,
        last_content_engaged_link: contentLink,
      });
      this.logger.log(`Tracked content_completed in GHL for: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error tracking content_completed in GHL: ${error.message}`,
      );
    }
  }

  async trackShareLinkGenerated(
    email: string,
    contentTitle: string,
    shareLink: string,
  ): Promise<void> {
    try {
      const contactId = await this.lookupContactByEmail(email);
      if (!contactId) return;
      await axios.post(
        `${this.apiUrl}contacts/${contactId}/tags`,
        { tags: ['Share Link Generated'] },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Tracked share_link_generated in GHL for: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error tracking share_link_generated in GHL: ${error.message}`,
      );
    }
  }

  async trackShareLinkClicked(ownerEmail: string): Promise<void> {
    try {
      const contactId = await this.lookupContactByEmail(ownerEmail);
      if (!contactId) return;
      await axios.post(
        `${this.apiUrl}contacts/${contactId}/tags`,
        { tags: ['Share Link Clicked'] },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Tracked share_link_clicked in GHL for: ${ownerEmail}`);
    } catch (error) {
      this.logger.error(
        `Error tracking share_link_clicked in GHL: ${error.message}`,
      );
    }
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
