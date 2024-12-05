import { AxiosInstance } from "axios";
import { API_URLS_LEGACY } from "../../helpers/constants";
import { getClientType } from "../../helpers/client";
import { Workspace } from "../../interfaces/workspace.interface";
import AuthModule from "../auth";

class WorkspaceModule {
  public workspaceInstance?: Workspace;

  constructor(private httpClient: AxiosInstance) {}

  async init(domain: string): Promise<Workspace> {
    try {
      // Set the domain in the headers for all subsequent requests
      // this.httpClient.defaults.headers.common['domain'] = domain;

      // Get business configuration with legacy PHP backend using this.httpClient

      if (localStorage.getItem("workspace")) {
        const workspace = JSON.parse(
          localStorage.getItem("workspace") as string
        );
        this.workspaceInstance = workspace;
        document.title = workspace.businessDomain + " | Zvolv";
        if (domain === workspace.businessDomain) return workspace;
        else localStorage.removeItem("workspace");
      }
      const clientType = getClientType();
      const headers = {
        device: clientType,
      };
      const url = `${API_URLS_LEGACY.workspace}/${domain}`;
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

        if (response.data.data.hasOwnProperty("AD_INTEGRATION")) {
          workspace.adIntegration = response.data.data.AD_INTEGRATION;
        }

        if (response.data.data.APP_CONFIG) {
          workspace.twoFALogin = response.data.data.APP_CONFIG.TWO_FA_LOGIN
            ? response.data.data.APP_CONFIG.TWO_FA_LOGIN
            : false;
          workspace.onlyOTPLogin = response.data.data.APP_CONFIG.OTP_LOGIN
            ? response.data.data.APP_CONFIG.OTP_LOGIN
            : false;
        }

        this.workspaceInstance = workspace;
        localStorage.setItem("workspace", JSON.stringify(workspace));
        document.title = workspace.businessDomain + " | Zvolv";
        return workspace;
      } else {
        throw new Error(response.data.message || "Initialization failed");
      }
    } catch (error) {
      throw new Error("An error occurred during workspace initialization");
    }
  }
}

export default WorkspaceModule;
