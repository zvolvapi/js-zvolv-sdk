import { AxiosInstance } from 'axios';
import { API_URLS, API_URLS_LEGACY } from '../../helpers/constants';
import { getClientType } from '../../helpers/client';
import { sha512 } from 'js-sha512';
import { User } from '../../interfaces/auth.interface';
import { Workspace, WorkspaceV2 } from '../../interfaces/workspace.interface';

class AuthModule {

  public userInstance?: User;

  constructor(private httpClient: AxiosInstance, private workspaceInstance?: Workspace, private workspaceV2Instance?: WorkspaceV2) { }

  async loginV1(email: string, password: string): Promise<User> {
    // Implement login logic with legacy PHP backend using this.httpClient
    try {
      password = sha512(password);
      const clientType = getClientType();
      const headers = {
        'jwt': true,
        'device': clientType,
        'businessDomain': this.httpClient.defaults.headers.common['domain'],
        'businessTagId': this.workspaceInstance?.businessTagId
      };
      const response = await this.httpClient.post(API_URLS_LEGACY.login, { email, password }, { headers });
      if (response.status === 200 && response.data.error === false) {
        const token = response.data.loginToken;
        // Set the token in the Authorization header for all subsequent requests
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this.userInstance = response.data;
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      throw new Error('An error occurred during login');
    }
  }

  async logout(): Promise<any> {
    // Implement logout logic using this.httpClient
    console.log('its in logout')
  }

  async loginV2(email: string, password: string): Promise<User> {
    try {
      password = sha512(password);
      const clientType = getClientType();
      const headers = {
        'jwt': true,
        'device': clientType,
        'businessDomain': this.httpClient.defaults.headers.common['domain'],
        'businessTagId': this.workspaceV2Instance?.CONFIG.BUSINESS_TAG_ID
      };
      const url = `${this.workspaceV2Instance?.URL}${API_URLS.login}`;
      const { status, data } = await this.httpClient.post(url, { email, password }, { headers });
      if (status === 200 && data.error === false) {
        const token = data.loginToken;
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this.userInstance = data;
        if (this.workspaceV2Instance)
          this.workspaceV2Instance.isLoggedIn = true;
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    }
    catch (error) {
      throw new Error('An error occurred during login');
    }
  }

  async login(email: string, password: string): Promise<User> {
    if (this.workspaceV2Instance) {
      return this.loginV2(email, password);
    } else {
      return this.loginV1(email, password);
    }
  }
}

export default AuthModule;
