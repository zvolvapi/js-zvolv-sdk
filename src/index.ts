import axios, { AxiosInstance } from 'axios';
import AuthModule from './modules/auth';
import WorkspaceModule from './modules/workspace';
import AnalyticsModule from './modules/analytics';

export class ZvolvClient {
  private httpClient: AxiosInstance;
  private _workspace?: WorkspaceModule;
  private _auth?: AuthModule;
  private _analytics?: AnalyticsModule;

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
      this._auth = new AuthModule(this.httpClient, this._workspace.workspaceInstance);
    }
    return this._auth;
  }

  get analytics() {
    this.validate();

    if (!this._analytics) {
      this._analytics = new AnalyticsModule(this.httpClient);
    }

    return this._analytics;
  }


  // Validate if workspace and user are initialized
  validate() {
    // Check if workspace is initialized 
    if (!this._workspace?.workspaceInstance) {
      throw new Error('Workspace not initialized! Please use workspace.init() before calling auth methods');
    }

    // Check if user is logged in
    if (!this._auth?.userInstance) {
      throw new Error('User not logged in! Please use auth.login() before calling analytics methods');
    }
  }
}
