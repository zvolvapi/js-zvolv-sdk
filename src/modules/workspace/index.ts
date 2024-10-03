import { AxiosInstance } from 'axios';
import { API_URLS, API_URLS_LEGACY } from '../../helpers/constants';
import { getClientType } from '../../helpers/client';
import { InitPayload, Workspace, WorkspaceV2 } from '../../interfaces/workspace.interface';

class WorkspaceModule {

  public workspaceInstance?: Workspace;
  public workspaceInstanceV2?: WorkspaceV2;

  constructor(private httpClient: AxiosInstance) { }

  async init(domain: string): Promise<Workspace> {
    try {
      // Set the domain in the headers for all subsequent requests
      // this.httpClient.defaults.headers.common['domain'] = domain;

      // Get business configuration with legacy PHP backend using this.httpClient
      const clientType = getClientType();
      const headers = {
        'device': clientType
      };
      const url = `https://${domain}/${API_URLS_LEGACY.workspace}`;
      const response = await this.httpClient.get(url, { headers });
      if (response.status === 200 && response.data.error === false) {
        const workspace: Workspace = {
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

        this.workspaceInstance = workspace;
        return workspace;
      } else {
        throw new Error(response.data.message || 'Initialization failed');
      }
    } catch (error) {
      throw new Error('An error occurred during workspace initialization');
    }
  }

  async initV2(payload?: InitPayload) {
    try {
      if (localStorage.getItem('initZvolv')) {
        this.workspaceInstanceV2 = JSON.parse(localStorage.getItem('initZvolv') as string) as WorkspaceV2;
        return this.workspaceInstanceV2;
      }
      if (!payload) {
        throw new Error('Payload is required for initialization');
      }
      const { PROTOCOL, DOMAIN, HOST, VERSION, ...rest } = payload;
      const clientType = getClientType();
      const headers = {
        'device': clientType
      };
      const workspace: Partial<WorkspaceV2> = {
        URL: `${PROTOCOL}${DOMAIN}${HOST}/${VERSION}`,
        INIT_CONFIG: {
          PROTOCOL,
          DOMAIN,
          HOST,
          VERSION,
          ...rest
        },
        isLoggedIn: false
      }
      const configUrl = `${workspace.URL}${API_URLS.config}${DOMAIN}`;
      const { status, data: { data, error } } = await this.httpClient.get(configUrl, { headers })
        ;
      if (status === 200 && !error) {
        workspace.CONFIG = data;
        this.workspaceInstanceV2 = workspace as WorkspaceV2;
        localStorage.setItem('initZvolv', JSON.stringify(workspace));
        return workspace as WorkspaceV2;
      } else {
        throw new Error('Initialization failed');
      }

    }
    catch (err) {
      throw new Error('An error occurred during workspace initialization');
    }
  }
}

export default WorkspaceModule;
