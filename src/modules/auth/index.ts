import { AxiosInstance } from 'axios';
import { API_URLS_LEGACY } from '../../helpers/constants';
import { getClientType } from '../../helpers/client';
import { sha512 } from 'js-sha512';
import { User } from '../../interfaces/auth.interface';

class AuthModule {

  private userInstance: User;

  constructor(private httpClient: AxiosInstance) {}

  async login(email: string, password: string): Promise<User> {
    // Implement login logic with legacy PHP backend using this.httpClient
    try {
      password = sha512(password);
      const clientType = getClientType();
      const headers = {
        'jwt': true,
        'device': clientType,
        'businessDomain': this.httpClient.defaults.headers['domain'],
        'businessTagId' : "449VZ2DY54AF3"
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
}

export default AuthModule;
