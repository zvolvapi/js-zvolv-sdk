import { AxiosInstance } from "axios";
import { API_URLS_LEGACY } from "../../helpers/constants";
import { getClientType } from "../../helpers/client";
import {
  getServerKey,
  notifyAuthCryptReady,
  persistUserToStorage,
  readUserFromStorage,
  setServerKey,
  upgradeStoredPii,
} from "../../helpers/crypto";
import { sha512 } from "js-sha512";
import { User } from "../../interfaces/auth.interface";
import { Workspace } from "../../interfaces/workspace.interface";

class AuthModule {
  public userInstance?: User;
  private authCryptPromise?: Promise<void>;

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

  init() {
    const stored = readUserFromStorage();
    if (stored) {
      this.userInstance = stored as User;
    }
    if (this.userInstance) {
      this.setToken();
      void this.fetchAuthCrypt();
    }
  }

  private setToken() {
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.userInstance?.loginToken}`;
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
    try {
      if (!this.userInstance?.loginToken) return;
      const headers = {
        jwt: this.userInstance.loginToken,
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
        if (refreshed) {
          this.userInstance = refreshed as User;
        }
        notifyAuthCryptReady();
      } else {
        console.error("AUTH_CRYPT missing from auth/data");
      }
    } catch (error) {
      console.error("Failed to fetch AUTH_CRYPT", error);
    }
  }

  async logout(): Promise<any> {
    this.userInstance = undefined;
    setServerKey(null);
    localStorage.clear();
  }
}

export default AuthModule;
