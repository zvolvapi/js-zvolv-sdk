import axios, { AxiosInstance } from 'axios';
import AuthModule from './modules/auth';

export class ZvolvClient {
  private httpClient: AxiosInstance;
  private _auth?: AuthModule;

  constructor(host: string, domain: string) {
    this.httpClient = axios.create({
      baseURL: host,
      headers: {
        'domain': domain,
      },
    });
  }

  get auth() {
    if (!this._auth) {
      this._auth = new AuthModule(this.httpClient);
    }
    return this._auth;
  }
}
