import { AxiosInstance } from "axios";
import { getClientType } from "../../helpers/client";
import { Workspace } from "../../interfaces/workspace.interface";
import { API_URLS, API_URLS_LEGACY } from "../../helpers/constants";
import { User } from "../../interfaces/auth.interface";
import AuthModule from "../auth";

class WorflowModule {
  constructor(
    private httpClient: AxiosInstance,
    private workspaceInstance?: Workspace,
    private auth?: AuthModule
  ) {}

  async getWorkflows() {
    // Get workflows from the backend
    if (!this.workspaceInstance) {
      throw new Error("Workspace not initialized");
    }
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance.businessDomain,
        businessTagId: this.workspaceInstance.businessTagId,
      };
      const response = await this.httpClient.get(
        API_URLS_LEGACY.workflow +
          `/${this.workspaceInstance.businessTagId}/type?light=true`,
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data.data;
      } else {
        throw new Error("Error fetching workflows");
      }
    } catch (error) {
      throw new Error("Error fetching workflows");
    }
  }

  async getDashboards(id: string) {
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
      };
      const filters: Record<string, string> = {};
      filters["WorkflowTypeID"] = id;
      filters["Type"] = "DASHBOARD";
      const response = await this.httpClient.get(
        API_URLS_LEGACY.all_dashboards +
          "?filter=" +
          encodeURIComponent(JSON.stringify(filters)),
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data.data;
      } else {
        throw new Error("Error fetching dashboards");
      }
    } catch (error) {
      throw new Error("Error fetching dashboards");
    }
  }

  async getDashboard(id: string, zappId: string) {
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
      };

      const filters: Record<string, string> = {};
      filters["WorkflowTypeID"] = zappId;
      filters["Type"] = "DASHBOARD";
      const response = await this.httpClient.get(
        API_URLS_LEGACY.all_dashboards +
          `/${id}?filter=${encodeURIComponent(JSON.stringify(filters))}`,
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data.data;
      } else {
        throw new Error("Error fetching dashboard");
      }
    } catch (error) {
      throw new Error("Error fetching dashboard");
    }
  }

  async elasticSearch(query: any) {
    try {
      if (!this.auth?.userInstance) {
        await this.auth?.init();
      }
      // const clientType = getClientType();
      const headers = {
        // device: clientType,
        Domain: this.workspaceInstance?.businessDomain,
        // Host: this.workspaceInstance?.businessDomain + ".zvolv.com",
        Authorization: `Bearer ${this.auth?.userInstance?.loginToken}`,
      };
      delete this.httpClient.defaults.headers.common["Jwt"];

      const response = await this.httpClient.post(
        API_URLS.elastic_search,
        JSON.parse(query?.toString() || "{}"),
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data.data;
      } else {
        throw new Error("Error fetching data");
      }
    } catch (error) {
      throw new Error("Error fetching data");
    }
  }
}

export default WorflowModule;
