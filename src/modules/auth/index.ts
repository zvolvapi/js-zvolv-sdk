import { AxiosInstance } from 'axios';

class AuthModule {
  constructor(private httpClient: AxiosInstance) {}

  async login(username: string, password: string): Promise<any> {
    // Implement login logic using this.httpClient
    console.log('username', username);
    console.log('password', password);
    console.log('its in login')
  }

  async logout(): Promise<any> {
    // Implement logout logic using this.httpClient
    console.log('its in logout')
  }

  // Additional auth methods...
}

export default AuthModule;
