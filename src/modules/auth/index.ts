import { AxiosInstance } from "axios";
import { API_URLS_LEGACY } from "../../helpers/constants";
import { getClientType } from "../../helpers/client";
import { sha512 } from "js-sha512";
import { User } from "../../interfaces/auth.interface";
import { Workspace } from "../../interfaces/workspace.interface";

class AuthModule {
  public userInstance?: User;

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
        localStorage.setItem("user", JSON.stringify(response.data));
        this.setToken();
        return response.data;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      throw new Error(String(error) || "Login failed");
    }
  }

  async init() {
    if (localStorage.getItem("user")) {
      this.userInstance = JSON.parse(localStorage.getItem("user") as string);
    }
    if (this.userInstance) {
      this.setToken();
    }
  }

  private setToken() {
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.userInstance?.loginToken}`;
    this.httpClient.defaults.headers.common["Jwt"] =
      this.userInstance?.loginToken;
  }

  async logout(): Promise<any> {
    // Implement logout logic using this.httpClient
    this.userInstance = undefined;
    localStorage.clear();
  }
}

export default AuthModule;
