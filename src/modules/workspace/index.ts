import { AxiosInstance } from 'axios';
import { API_URLS_LEGACY } from '../../helpers/constants';
import { getClientType } from '../../helpers/client';
import { WorkspaceResponse } from '../../interfaces/workspace.interface';

class WorkspaceModule {
  constructor(private httpClient: AxiosInstance) {}

  async init(domain: string): Promise<WorkspaceResponse> {
    // Implement get business configuration logic with legacy PHP backend using this.httpClient
    try {
      const clientType = getClientType();
      const headers = {
        'device': clientType
      };
      const url = `${API_URLS_LEGACY.workspace}/${domain}`;
      const response = await this.httpClient.get(url, { headers });
      if (response.status === 200 && response.data.error === false) {
        const workspace: WorkspaceResponse = {
          businessTagId: response.data.data.BUSINESS_TAG_ID,
          businessDomain: response.data.data.BUSINESS_DOMAIN,
          businessTitle: response.data.data.LOGO_TEXT,
          logoUrl: response.data.data.LOGO_URL,
          faviconUrl: response.data.data.FAVICON_URL,
          primaryColor: response.data.data.PRIMARY_COLOR,
        };

        if (response.data.data.hasOwnProperty('AD_INTEGRATION')) {
          workspace.adIntegration = response.data.data.AD_INTEGRATION;
        }

        if (response.data.data.APP_CONFIG) {
          workspace.twoFALogin = response.data.data.APP_CONFIG.TWO_FA_LOGIN ? response.data.data.APP_CONFIG.TWO_FA_LOGIN : false;
          workspace.onlyOTPLogin = response.data.data.APP_CONFIG.OTP_LOGIN ? response.data.data.APP_CONFIG.OTP_LOGIN : false;
        }

        return workspace;
      } else {
        throw new Error(response.data.message || 'Initialization failed');
      }
    } catch (error) {
      throw new Error('An error occurred during workspace initialization');
    }
  }
}

export default WorkspaceModule;
