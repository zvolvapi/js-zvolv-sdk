import axios, { AxiosInstance } from 'axios';
import AuthModule from './modules/auth';
import WorkspaceModule from './modules/workspace';

export class ZvolvClient {
  private httpClient: AxiosInstance;
  private _workspace?: any;
  private _auth?: AuthModule;

  constructor(host: string) {
    this.httpClient = axios.create({
      baseURL: host
    });
  }

  get workspace() {
    if (!this._workspace) {
      this._workspace = new WorkspaceModule(this.httpClient);
    }
    return this._workspace;
  }

  get auth() {
    if (!this._auth) {
      this._auth = new AuthModule(this.httpClient);
    }
    return this._auth;
  }
}
