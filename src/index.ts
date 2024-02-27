import axios, { AxiosInstance } from 'axios';
import AuthModule from './modules/auth';
import WorkspaceModule from './modules/workspace';

export class ZvolvClient {
  private httpClient: AxiosInstance;
  private _workspace?: WorkspaceModule;
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
    // Check if workspace is initialized 
    if (!this._workspace?.workspaceInstance) {
      throw new Error('Workspace not initialized! Please use workspace.init() before calling auth methods');
    }

    if (!this._auth) {
      this._auth = new AuthModule(this.httpClient);
    }
    return this._auth;
  }
}
