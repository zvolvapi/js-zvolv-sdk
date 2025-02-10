import { AxiosInstance } from "axios";
import { createApiUrl, getClientType } from "../../helpers/client";
import { Workspace } from "../../interfaces/workspace.interface";
import { API_URLS, API_URLS_LEGACY, appVariables } from "../../helpers/constants";
import AuthModule from "../auth";
import { Form } from "../../interfaces/form.interface";

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

  async getFieldDistinctValues(input: any) {
    try {
      if (!this.auth?.userInstance) {
        await this.auth?.init();
      }
      const headers = {
        Domain: this.workspaceInstance?.businessDomain,
        Authorization: `Bearer ${this.auth?.userInstance?.loginToken}`,
      };
      delete this.httpClient.defaults.headers.common["Jwt"];
      const response = await this.httpClient.post(
        API_URLS.field_unique_values,
        JSON.parse(input),
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

  async getDataSource(input: any) {
    try {
      if (!this.auth?.userInstance) {
        await this.auth?.init();
      }
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
        jwt: this.auth?.userInstance?.loginToken
      };
      delete this.httpClient.defaults.headers.common["Authorization"];
      let url:any = createApiUrl(API_URLS_LEGACY.get_data_source, JSON.parse(input))
      if (url.indexOf(`:${appVariables.businessTagID}`) !== -1) {
        url = url.replace(
          new RegExp(`:${appVariables.businessTagID}`, 'g'),
          this.workspaceInstance?.businessTagId
        );
      }
      const response = await this.httpClient.get(
        url,
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response;
      } else {
        throw new Error("Error fetching data");
      }
    } catch (error) {
      throw new Error("Error fetching data");
    }
  }

  async getSingleForm(formId: string): Promise<Form> {
    try {
      if (!this.auth?.userInstance) {
        await this.auth?.init();
      }
      const headers = {
        Domain: this.workspaceInstance?.businessDomain,
        Authorization: `Bearer ${this.auth?.userInstance?.loginToken}`,
      };
      delete this.httpClient.defaults.headers.common["Jwt"];
      const url = createApiUrl(API_URLS.fetch_form,{ id: formId });
      const response = await this.httpClient.get(
        url,
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data;
      } else {
        throw new Error("Error fetching form");
      }
    } catch (error) {
      throw new Error("Error fetching Form");
    }
  }

  async getUserGroup(filter: string): Promise<Form> {
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
        jwt: this.auth?.userInstance?.loginToken
      };
      delete this.httpClient.defaults.headers.common["Authorization"];
      let url:any = createApiUrl(API_URLS_LEGACY.get_usergroups_url, {filter : filter})
      if (url.indexOf(`:${appVariables.businessTagID}`) !== -1) {
        url = url.replace(
          new RegExp(`:${appVariables.businessTagID}`, 'g'),
          this.workspaceInstance?.businessTagId
        );
      }
      const response = await this.httpClient.get(
        url,
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response.data;
      } else {
        throw new Error("Error fetching data");
      }
    } catch (error) {
      throw new Error("Error fetching data");
    }
  }

  async searchMembers(body: string): Promise<Form> {
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
        jwt: this.auth?.userInstance?.loginToken
      };
      delete this.httpClient.defaults.headers.common["Authorization"];
      const filters = {HideSpecialUserGroups:true};
      const url = createApiUrl(API_URLS_LEGACY.search_users, {filters : JSON.stringify(filters)});
      const response = await this.httpClient.post(
        url,
        JSON.parse(body),
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

  async putWidget(input: any, body: any): Promise<any> {
    try {
      if (!this.auth?.userInstance) {
        await this.auth?.init();
      }
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
        jwt: this.auth?.userInstance?.loginToken
      };
      delete this.httpClient.defaults.headers.common["Authorization"];
      let url:any = createApiUrl(API_URLS_LEGACY.edit_analytics_report_widget, JSON.parse(input))
      if (url.indexOf(`:${appVariables.businessTagID}`) !== -1) {
        url = url.replace(
          new RegExp(`:${appVariables.businessTagID}`, 'g'),
          this.workspaceInstance?.businessTagId
        );
      }
      const response = await this.httpClient.put(
        url,
        JSON.parse(body),
        { headers }
      );
      if (response.status === 200 && response.data.error === false) {
        return response;
      } else {
        throw new Error("Error fetching data");
      }
    } catch (error) {
      throw new Error("Error fetching data");
    }
  }

  async downloadDossier(url: string) {
    try {
      const clientType = getClientType();
      const headers = {
        device: clientType,
        businessDomain: this.workspaceInstance?.businessDomain,
        businessTagId: this.workspaceInstance?.businessTagId,
      };
      const response = await this.httpClient.get(url, { headers });
      if (response.status === 200 && response.data.error === false) {
        return response.data;
      } else {
        throw new Error("Error fetching dashboards");
      }
    } catch (error) {
      throw new Error("Error fetching dashboards");
    }
  }

}

export default WorflowModule;
