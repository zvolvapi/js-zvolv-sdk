import axios, { AxiosInstance } from "axios";
import AuthModule from "./modules/auth";

export * from "./helpers/crypto";
import WorkspaceModule from "./modules/workspace";
import AnalyticsModule from "./modules/analytics";
import FormModule from "./modules/forms";
import SubmissionModule from "./modules/submissions";
import WorkflowModule from "./modules/workflow";
import ZaiServicesModule from "./modules/zai";

export class ZvolvClient {
  private httpClient: AxiosInstance;
  private _workspace?: WorkspaceModule;
  private _auth?: AuthModule;
  private _analytics?: AnalyticsModule;
  private _form?: FormModule;
  private _submission?: SubmissionModule;
  private _workflow?: WorkflowModule;
  private _zaiServices?: ZaiServicesModule;

  private sessionGuardInstalled = false;

  /**
   * @param host  The API host ("acme.zvolv.in") or a full origin ("https://acme.zvolv.in").
   *              A trailing "/rest" or "/" is ignored. A full origin keeps its own protocol.
   * @param ssl   Protocol for a bare host (default true = https). Ignored when `host` has a protocol.
   */
  constructor(host: string, ssl: boolean = true) {
    this.httpClient = axios.create({ baseURL: ZvolvClient.baseUrl(host, ssl) });
  }

  /** "acme.zvolv.in" | "https://acme.zvolv.in/rest/" → "https://acme.zvolv.in". */
  static baseUrl(host: string, ssl: boolean = true): string {
    const raw = String(host ?? "").trim().replace(/\/+$/, "").replace(/\/rest$/, "");
    if (!raw) throw new Error("ZvolvClient: host is required (e.g. \"acme.zvolv.in\")");
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${ssl ? "https" : "http"}://${raw}`;
  }

  /**
   * Builds a client from an app's config.json: { HOST, PROTOCOL?, DOMAIN }.
   * HOST is the workspace API host; when it is empty the current page's origin is used
   * (browser only), so a build served from the workspace calls its own domain.
   */
  static fromConfig(cfg: { HOST?: string; PROTOCOL?: string; DOMAIN?: string }): ZvolvClient {
    const host = String(cfg?.HOST ?? "").trim();
    if (host) return new ZvolvClient(host, (cfg.PROTOCOL ?? "https://").startsWith("https"));
    if (typeof window !== "undefined" && window.location?.host) {
      return new ZvolvClient(`${window.location.protocol}//${window.location.host}`);
    }
    if (cfg?.DOMAIN) return new ZvolvClient(`${cfg.DOMAIN}.zvolv.in`, true);
    throw new Error("ZvolvClient.fromConfig: HOST (or DOMAIN) is required");
  }

  /** The origin every request goes to. */
  get baseURL(): string {
    return String(this.httpClient.defaults.baseURL ?? "");
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
      throw new Error(
        "Workspace not initialized! Please use workspace.init() before calling auth methods"
      );
    }

    if (!this._auth) {
      this._auth = new AuthModule(
        this.httpClient,
        this._workspace.workspaceInstance
      );
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

  get form() {
    this.validate();
    if (!this._form) {
      this._form = new FormModule(this.httpClient);
    }
    return this._form;
  }

  get submission() {
    this.validate();

    if (!this._submission) {
      this._submission = new SubmissionModule(
        this.httpClient,
        this._workspace?.workspaceInstance,
        this.auth
      );
    }
    return this._submission;
  }

  get workflow() {
    this.validate();
    // this.validate().then((userInstance) => {
    if (!this._workflow) {
      this._workflow = new WorkflowModule(
        this.httpClient,
        this._workspace?.workspaceInstance,
        this.auth
      );
    }
    return this._workflow;
    // });
  }

  get zaiServices() {
    this.validate();
    if (!this._zaiServices) {
      this._zaiServices = new ZaiServicesModule(
        this.httpClient,
        this._workspace?.workspaceInstance,
        this.auth
      );
    }
    return this._zaiServices;
  }

  // Validate if workspace and user are initialized
  validate() {
    // Check if workspace is initialized
    if (!this._workspace?.workspaceInstance) {
      throw new Error(
        "Workspace not initialized! Please use workspace.init() before calling auth methods"
      );
    }
    let authInstance = this._auth?.userInstance || this.auth.userInstance;

    if (!authInstance) {
      this._auth?.init();
      authInstance = this._auth?.userInstance || this.auth.userInstance;
      if (!authInstance) {
        throw new Error(
          "User not initialized! Please use auth.login() before calling other methods"
        );
      }
    }
    // Install the expired-session guard once (it used to be added on every module access).
    if (!this.sessionGuardInstalled) {
      this.sessionGuardInstalled = true;
      this.httpClient.interceptors.response.use((response) => {
        if (response?.data?.error && response.data.error_code === 3) {
          if (this._auth) {
            this._auth.userInstance = undefined;
          }
          if (typeof localStorage !== "undefined") localStorage.clear();
          if (typeof window !== "undefined") window.location.reload();
        }
        return response;
      });
    }
  }
}
