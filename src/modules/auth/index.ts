import { AxiosInstance } from "axios";
import { API_URLS_LEGACY } from "../../helpers/constants";
import { getClientType } from "../../helpers/client";
import {
  decryptAuthObject,
  decryptValue,
  getServerKey,
  mergeReadable,
  notifyAuthCryptReady,
  persistUserToStorage,
  readUserFromStorage,
  setServerKey,
  upgradeStoredPii,
} from "../../helpers/crypto";
import { sha512 } from "js-sha512";
import { Session, User, UserGroupMembership } from "../../interfaces/auth.interface";
import { buildSession } from "../../helpers/session";
import { Workspace } from "../../interfaces/workspace.interface";

class AuthModule {
  public userInstance?: User;
  private authCryptPromise?: Promise<void>;
  private memberships: UserGroupMembership[] = [];
  private membershipLoader?: (userId: number) => Promise<UserGroupMembership[]>;

  /** How long ready() waits for the server key before giving up (ms). */
  static READY_TIMEOUT_MS = 8000;

  constructor(
    private httpClient: AxiosInstance,
    private workspaceInstance: Workspace
  ) {}

  async login(email: string, password: string): Promise<User> {
    // Implement login logic with legacy PHP backend using this.httpClient
    try {
      password = sha512(password);
      const clientType = getClientType();
      const headers = {
        jwt: true,
        device: clientType,
        businessDomain: this.workspaceInstance.businessDomain,
        businessTagId: this.workspaceInstance.businessTagId,
      };
      const response = await this.httpClient.post(
        API_URLS_LEGACY.login,
        { email, password },
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        this.userInstance = response.data;
        persistUserToStorage(response.data);
        this.setToken();
        void this.fetchAuthCrypt();
        return response.data;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      throw new Error(String(error) || "Login failed");
    }
  }

  async forgotPassword(email: string): Promise<any> {
    const headers = {
      jwt: true,
      device: getClientType(),
      businessDomain: this.workspaceInstance.businessDomain,
      businessTagId: this.workspaceInstance.businessTagId,
    };
    const response = await this.httpClient.post(
      API_URLS_LEGACY.forgot_password,
      { email },
      { headers }
    );
    if (response.status === 200 && response.data?.error === false) {
      return response.data;
    }
    throw new Error(
      response.data?.message || "Could not send the password reset link"
    );
  }

  init() {
    const stored = readUserFromStorage();
    if (stored) {
      // A field already readable in memory is never replaced by ciphertext from storage.
      this.userInstance = mergeReadable(stored, this.userInstance) as User;
    }
    if (this.userInstance) {
      this.setToken();
      void this.fetchAuthCrypt();
    }
  }

  private setToken() {
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${decryptValue(this.userInstance?.loginToken)}`;
  }

  /** The session token, decrypted ("" when signed out). */
  get token(): string {
    const t = decryptValue(this.userInstance?.loginToken);
    return typeof t === "string" && !t.startsWith("enc::") ? t : "";
  }

  /**
   * Resolves once the stored user can be read: the server key (AUTH_CRYPT) is loaded,
   * or there is no session, or READY_TIMEOUT_MS passed. Never rejects.
   * Await it before reading role / name / group on a restored session.
   */
  ready(timeoutMs: number = AuthModule.READY_TIMEOUT_MS): Promise<void> {
    if (!this.userInstance) this.init();
    if (!this.userInstance?.loginToken || getServerKey()) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      this.fetchAuthCrypt().finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * The signed-in user, decrypted and normalised: userId, name, email, role, isAdmin,
   * groupId, groupIds, ready. Synchronous — fields that are still encrypted are left
   * empty and `ready` is false; use loadSession() to wait for them and the group
   * memberships.
   */
  get session(): Session {
    if (!this.userInstance) this.init();
    return buildSession(this.userInstance, this.memberships);
  }

  /**
   * Waits for ready(), loads the user's group memberships and returns the full session.
   * Membership lookup failures are logged and leave groupIds = [groupId].
   */
  async loadSession(opts: { refresh?: boolean } = {}): Promise<Session> {
    await this.ready();
    const base = buildSession(this.userInstance);
    if (base.userId && this.membershipLoader && (opts.refresh || this.memberships.length === 0)) {
      try {
        this.memberships = await this.membershipLoader(base.userId);
      } catch (e) {
        console.error("Could not load user-group memberships", e);
      }
    }
    return buildSession(this.userInstance, this.memberships);
  }

  /** Set by ZvolvClient: how group memberships are looked up. */
  setMembershipLoader(loader: (userId: number) => Promise<UserGroupMembership[]>): void {
    this.membershipLoader = loader;
  }

  fetchAuthCrypt(): Promise<void> {
    if (getServerKey()) return Promise.resolve();
    if (!this.authCryptPromise) {
      this.authCryptPromise = this.requestAuthCrypt().finally(() => {
        this.authCryptPromise = undefined;
      });
    }
    return this.authCryptPromise;
  }

  private async requestAuthCrypt(): Promise<void> {
    // A few attempts on transient errors (zvolv-web retries too); a response without
    // AUTH_CRYPT is final.
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await this.requestAuthCryptOnce();
      if (result !== "error") return;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  private async requestAuthCryptOnce(): Promise<"applied" | "missing" | "error"> {
    try {
      const token = this.token;
      if (!token) return "missing";
      const headers = {
        jwt: token,
        businessDomain: this.workspaceInstance.businessDomain,
        device: getClientType(),
        businessTagId: this.workspaceInstance.businessTagId,
      };
      const response = await this.httpClient.get(API_URLS_LEGACY.authData, {
        headers,
      });
      const authCrypt =
        response?.data?.AUTH_CRYPT ?? response?.data?.data?.AUTH_CRYPT;
      if (response.status === 200 && authCrypt) {
        setServerKey(String(authCrypt));
        upgradeStoredPii();
        const refreshed = readUserFromStorage();
        const current = this.userInstance ? decryptAuthObject(this.userInstance) : undefined;
        this.userInstance = (refreshed ? mergeReadable(refreshed, current) : current) as User;
        notifyAuthCryptReady();
        return "applied";
      }
      console.error("AUTH_CRYPT missing from auth/data");
      return "missing";
    } catch (error) {
      console.error("Failed to fetch AUTH_CRYPT", error);
      return "error";
    }
  }

  async logout(): Promise<any> {
    this.userInstance = undefined;
    this.memberships = [];
    setServerKey(null);
    localStorage.clear();
  }
}

export default AuthModule;
