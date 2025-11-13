import { AxiosInstance } from "axios";
import { createApiUrl, getClientType } from "../../helpers/client";
import { Workspace } from "../../interfaces/workspace.interface";
import {
  API_URLS,
  API_URLS_LEGACY,
  appVariables,
} from "../../helpers/constants";
import AuthModule from "../auth";
import { Form } from "../../interfaces/form.interface";

class WorkflowModule {
  constructor(
    private httpClient: AxiosInstance,
    private workspaceInstance?: Workspace,
    private auth?: AuthModule
  ) {}

  private async getHeaders(authRequired = false): Promise<Record<string, any>> {
    // Ensure auth is initialized if required
    if (authRequired && this.auth && !this.auth.userInstance) {
      await this.auth.init();
    }

    const headers: Record<string, any> = {};

    if (authRequired && this.auth?.userInstance?.loginToken) {
      headers.Authorization = `Bearer ${this.auth.userInstance.loginToken}`;
      headers.domain = this.workspaceInstance?.businessDomain;
    } else if (this.auth?.userInstance?.loginToken) {
      headers.jwt = this.auth.userInstance.loginToken;
      headers.businessDomain = this.workspaceInstance?.businessDomain;
      headers.device = getClientType();
      headers.businessTagId = this.workspaceInstance?.businessTagId;
    }
    return headers;
  }

  private async handleRequest(
    method: string,
    url: string,
    data?: any,
    authRequired = false
  ) {
    try {
      const response = await this.httpClient.request({
        method,
        url,
        data,
        headers: await this.getHeaders(authRequired),
      });
      if (
        (response.status === 200 || response.status === 201) &&
        response.data.error === false
      ) {
        return response.data.data || response.data;
      }
      throw new Error("Error fetching data");
    } catch (error) {
      throw new Error("Error fetching data");
    }
  }

  async getWorkflows() {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const url = `${API_URLS_LEGACY.workflow}/${this.workspaceInstance.businessTagId}/type?light=true`;
    return this.handleRequest("get", url);
  }

  async getDashboards(id: string) {
    const url = `${API_URLS_LEGACY.all_dashboards}?filter=${encodeURIComponent(
      JSON.stringify({ WorkflowTypeID: id, Type: "DASHBOARD" })
    )}`;
    return this.handleRequest("get", url);
  }

  async getDashboard(id: string, zappId: string) {
    const url = `${
      API_URLS_LEGACY.all_dashboards
    }/${id}?filter=${encodeURIComponent(
      JSON.stringify({ WorkflowTypeID: zappId, Type: "DASHBOARD" })
    )}`;
    return this.handleRequest("get", url);
  }

  async elasticSearch(query: any) {
    return this.handleRequest(
      "post",
      API_URLS.elastic_search,
      JSON.parse(query?.toString() || "{}"),
      true
    );
  }

  async getFieldDistinctValues(input: any) {
    return this.handleRequest(
      "post",
      API_URLS.field_unique_values,
      JSON.parse(input),
      true
    );
  }

  async getDataSource(input: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_data_source, JSON.parse(input));
    url = url.replace(
      new RegExp(`:${appVariables.businessTagID}`, "g"),
      this.workspaceInstance?.businessTagId
    );
    return this.handleRequest("get", url, undefined, true);
  }

  async getSingleForm(formId: string): Promise<Form> {
    const url = createApiUrl(API_URLS.fetch_form, { id: formId });
    return this.handleRequest("get", url, undefined, true);
  }

  async getUserGroup(filter: string): Promise<Form> {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_usergroups_url, { filter });
    url = url.replace(
      new RegExp(`:${appVariables.businessTagID}`, "g"),
      this.workspaceInstance?.businessTagId
    );
    return this.handleRequest("get", url, undefined, true);
  }

  async searchMembers(body: string): Promise<Form> {
    const url = createApiUrl(API_URLS_LEGACY.search_users, {
      filters: JSON.stringify({ HideSpecialUserGroups: true }),
    });
    return this.handleRequest("post", url, JSON.parse(body), true);
  }

  async putWidget(input: any, body: any): Promise<any> {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(
      API_URLS_LEGACY.edit_analytics_report_widget,
      JSON.parse(input)
    );
    url = url.replace(
      new RegExp(`:${appVariables.businessTagID}`, "g"),
      this.workspaceInstance?.businessTagId
    );
    return this.handleRequest("put", url, JSON.parse(body), true);
  }

  async downloadDossier(url: string) {
    return this.handleRequest("get", url);
  }

  async getSubmissionAll(
    formId: any,
    skip: any,
    limit: any,
    sort: any,
    elementFilter: any,
    filters: any,
    filterOperator: any = null
  ) {
    const body = {
      skip: skip,
      limit: limit,
      sort: sort,
      elementFilter: elementFilter,
      filter: filters,
      filterOperator: filterOperator,
    };
    let url = API_URLS.submissiog_rpc_all;
    url = url.replace(
      new RegExp(`:${appVariables.submissionTagId}`, "g"),
      formId
    );
    return this.handleRequest("post", url, body, true);
  }

  async updateSubmission(formId: string, body: string) {
    let url = createApiUrl(API_URLS.update_submission, { id: formId });
    return this.handleRequest("put", url, JSON.parse(body), true);
  }

  async getAuthData() {
    return this.handleRequest(
      "get",
      API_URLS_LEGACY.authData,
      undefined,
      false
    );
  }

  async getUserGroupList(body: any): Promise<Form> {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_user_list, {});
    url = url.replace(
      new RegExp(`:${appVariables.businessTagID}`, "g"),
      this.workspaceInstance?.businessTagId
    );
    return this.handleRequest("post", url, JSON.parse(body));
  }
}

export default WorkflowModule;
