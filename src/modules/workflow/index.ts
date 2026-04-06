import { AxiosInstance } from "axios";
import { createApiUrl, getClientType } from "../../helpers/client";
import { Workspace } from "../../interfaces/workspace.interface";
import {
  API_URLS,
  API_URLS_LEGACY,
  TASK_API_URLS,
  TASK_API_URLS_LEGACY,
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

    const input_data = JSON.parse(input);
    if (!input_data.widgetId) return null;

    const url = createApiUrl(
      API_URLS_LEGACY.get_data_source,
      {
        [appVariables.businessTagID]: this.workspaceInstance.businessTagId,
        [appVariables.widgetId]: input_data.widgetId,
      },
      null,
      { wftype: input_data.wftype }
    );

    return this.handleRequest("get", url, undefined, false);
  }

  async getSingleForm(formId: string): Promise<Form> {
    const url = createApiUrl(API_URLS.fetch_form, { id: formId });
    return this.handleRequest("get", url, undefined, true);
  }

  async getAllNewForms(query: any): Promise<Form> {
    const url = createApiUrl(API_URLS.fetch_all_forms);
    return this.handleRequest("post", url, JSON.parse(query), true);
  }

  async getDocumentTemplates(): Promise<Form> {
    const url = createApiUrl(API_URLS_LEGACY.fetch_document_templates);
    return this.handleRequest("get", url, undefined, false);
  }


  async getAllForm() {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_all_form, {});
    url = url.replace(
      new RegExp(`:${appVariables.businessTagID}`, "g"),
      this.workspaceInstance?.businessTagId
    );
    return this.handleRequest("get", url, undefined, false);
  }

  async getSingleFormLegacy(formId: string) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_single_form, {
      businessTagId: this.workspaceInstance.businessTagId,
      formID: formId
    });

    return this.handleRequest("get", url, undefined, false);
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

  async addDashboard(body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.add_dashboard);
    return this.handleRequest("post", url, JSON.parse(body), false);
  }

  async editDashboard(reportId: any, body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.edit_dashboard);
    url = url.replace(
      new RegExp(`:${appVariables.reportTagId}`, "g"),
      reportId
    )
    return this.handleRequest("put", url, JSON.parse(body), false);
  }

  async deleteDashboard(reportId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.delete_dashboard);
    url = url.replace(
      new RegExp(`:${appVariables.reportTagId}`, "g"),
      reportId
    )
    return this.handleRequest("DELETE", url, undefined, false);
  }

  async getSingleWidget(WidgetID: string): Promise<Form> {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.get_single_widget, { WidgetID });
    url = url.replace(
      new RegExp(`:${appVariables.widgetId}`, "g"),
      WidgetID
    );
    return this.handleRequest("get", url, undefined, true);
  }

  async addWidget(body: any, reportId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.add_widget);
    url = url.replace(
      new RegExp(`:${appVariables.reportTagId}`, "g"),
      reportId
    );
    return this.handleRequest("post", url, JSON.parse(body), false);
  }

  async bulkaddWidget(body: any, reportId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.bulk_add_widget);
    url = url.replace(
      new RegExp(`:${appVariables.reportTagId}`, "g"),
      reportId
    );
    return this.handleRequest("post", url, JSON.parse(body), false);
  }
  async deleteWidget(body: any, widgetId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.delete_widget);
    url = url.replace(
      new RegExp(`:${appVariables.widgetId}`, "g"),
      widgetId
    );
    return this.handleRequest("post", url, JSON.parse(body), false);
  }
  async updateWidget(body: any, widgetId: any, reportId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.update_widget);
    url = url.replace(
      new RegExp(`:${appVariables.widgetId}`, "g"),
      widgetId
    );
    url = url.replace(
      new RegExp(`:${appVariables.reportTagId}`, "g"),
      reportId
    );
    return this.handleRequest("post", url, JSON.parse(body), false);
  }

  async editWidget(body: any, widgetId: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.edit_widget);
    url = url.replace(
      new RegExp(`:${appVariables.widgetId}`, "g"),
      widgetId
    );
    return this.handleRequest("put", url, JSON.parse(body), false);
  }

  // -------------------------------------------------------------------------
  // Databases — Legacy API
  // -------------------------------------------------------------------------

  async dbGetMasterForms() {
    const filter = JSON.stringify([{ operator: '=', value: 'MASTER', column: 'FormType' }]);
    const url = `${API_URLS_LEGACY.db_get_forms_lite}?filter=${encodeURIComponent(filter)}`;
    return this.handleRequest("get", url, undefined, false);
  }

  async dbGetFormLite(formId: string | number, filter?: Record<string, any>) {
    let url = createApiUrl(API_URLS_LEGACY.db_get_form_lite, { formId });
    if (filter) url += `?filter=${encodeURIComponent(JSON.stringify(filter))}`;
    return this.handleRequest("get", url, undefined, false);
  }

  async dbGetAllSubmissionsLite(formId: string | number, filter: any[], limit: number, offset: number, globalSearchBody: any[]) {
    const combined = [...filter, { operator: '=', value: formId, column: 'FormID' }, ...globalSearchBody];
    const pagination = JSON.stringify({ limit, offset });
    const url = `${API_URLS_LEGACY.db_get_submissions_lite}?pagination=${encodeURIComponent(pagination)}&filter=${encodeURIComponent(JSON.stringify(combined))}`;
    return this.handleRequest("get", url, undefined, false);
  }

  async dbGetAllUploads(formId: string | number) {
    const url = createApiUrl(API_URLS_LEGACY.db_get_bulk_uploads, { resourceId: formId });
    return this.handleRequest("get", url, undefined, false);
  }

  async dbGetAllDownloads(formId: string | number) {
    const url = createApiUrl(API_URLS_LEGACY.db_get_bulk_downloads, { resourceId: formId });
    return this.handleRequest("get", url, undefined, false);
  }

  async dbBulkDownload(formId: string | number, formSubmissionIds: any[]) {
    const url = createApiUrl(API_URLS_LEGACY.db_bulk_export, { formId });
    return this.handleRequest("post", url, { FormSubmissionIDs: formSubmissionIds }, true);
  }

  async dbDeleteSubmissions(formId: string | number, formSubmissionIds: any[]) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.db_delete_submissions, { formId });
    url = url.replace(`:${appVariables.businessTagID}`, this.workspaceInstance.businessTagId);
    return this.handleRequest("post", url, { FormSubmissionIDs: formSubmissionIds }, true);
  }

  async dbDeleteAllSubmissions(formId: string | number) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.db_delete_all_submissions, { formId });
    url = url.replace(`:${appVariables.businessTagID}`, this.workspaceInstance.businessTagId);
    return this.handleRequest("delete", url, undefined, true);
  }

  async dbSendDownloadSummary(formId: string | number, jobId: string, body: any) {
    const url = createApiUrl(API_URLS_LEGACY.db_send_download_summary, { resourceId: formId, jobId });
    return this.handleRequest("post", url, body, true);
  }

  async dbSingleSubmissionDownload(formSubmissionId: string | number) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.db_single_submission_download, { formSubmissionId });
    url = url.replace(`:${appVariables.businessTagID}`, this.workspaceInstance.businessTagId);
    return this.handleRequest("get", url, undefined, true);
  }

  async dbCreateFormLegacy(data: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.db_create_form_legacy);
    url = url.replace(`:${appVariables.businessTagID}`, this.workspaceInstance.businessTagId);
    return this.handleRequest("post", url, data, true);
  }

  async dbPutFormDetails(formId: string | number, body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    let url = createApiUrl(API_URLS_LEGACY.db_put_form_details, { formId });
    url = url.replace(`:${appVariables.businessTagID}`, this.workspaceInstance.businessTagId);
    return this.handleRequest("put", url, body, true);
  }

  async dbFileUpload(formId: number, formData: FormData) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const btId = this.workspaceInstance.businessTagId;
    let url = createApiUrl(API_URLS_LEGACY.db_file_upload);
    url = url.replace(new RegExp(`:${appVariables.businessTagID}`, "g"), btId);
    const headers = { ...(await this.getHeaders(true)), 'Content-Type': 'multipart/form-data' };
    try {
      const response = await this.httpClient.request({ method: "post", url, data: formData, headers });
      if (response.status === 200 || response.status === 201) return response.data;
      throw new Error("File upload failed");
    } catch {
      throw new Error("File upload failed");
    }
  }

  async dbBulkUploadLegacy(formId: string | number, formData: FormData) {
    const url = createApiUrl(API_URLS_LEGACY.db_bulk_upload, { formId });
    const headers = { ...(await this.getHeaders(true)), 'Content-Type': 'multipart/form-data' };
    try {
      const response = await this.httpClient.request({ method: "post", url, data: formData, headers });
      if (response.status === 200 || response.status === 201) return response.data;
      throw new Error("Bulk upload failed");
    } catch {
      throw new Error("Bulk upload failed");
    }
  }

  // -------------------------------------------------------------------------
  // Databases — New (Bifrost) API
  // -------------------------------------------------------------------------

  async dbGetAllForms(query: { skip: number; limit: number; sort: any; filter: any[]; filterOperator: string | null }) {
    return this.handleRequest("post", API_URLS.db_create_form.replace('/forms', '/forms/find/all'), query, true);
  }

  async dbCreateForm(data: any) {
    return this.handleRequest("post", API_URLS.db_create_form, data, true);
  }

  async dbUpdateForm(data: any, enableRetrofit = false) {
    const url = `${API_URLS.db_update_form}?enableRetrofit=${enableRetrofit}`;
    return this.handleRequest("put", url, data, true);
  }

  async dbDeleteSubmissionsGrpc(formId: string | number, submissionIds: any[], isTruncate = false) {
    return this.handleRequest("post", API_URLS.db_delete_submissions_grpc, { formId, submissionIds, isTruncate }, true);
  }

  async dbGetBulkExport(formId: string | number, exportType: 'csv' | 'xlsx'): Promise<Blob> {
    const url = createApiUrl(API_URLS.db_bulk_export_grpc, { id: formId, type: exportType });
    const headers = await this.getHeaders(true);
    const contentType = exportType === 'csv'
      ? 'application/zip'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    try {
      const response = await this.httpClient.request({
        method: "post",
        url,
        data: {},
        headers: { ...headers, 'Content-Type': contentType, Accept: contentType },
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch {
      throw new Error("Export failed");
    }
  }

  async dbPostBulkImport(formId: string | number, filePathUrl: string) {
    const url = createApiUrl(API_URLS.db_bulk_import, { id: formId });
    return this.handleRequest("post", url, { fileUrl: filePathUrl }, true);
  }

  async dbGetDataSyncDetails(id: number, onlyCountReq: boolean, skip: number, limit: number) {
    const url = createApiUrl(API_URLS.db_data_sync_single, { id, onlyCountReq: String(onlyCountReq) }, null, { skip, limit });
    return this.handleRequest("get", url, undefined, true);
  }

  async dbGetAllDataSync(skip: number, limit: number, filter: any[], filterOperator: string | null) {
    return this.handleRequest("post", API_URLS.db_data_sync_all, { skip, limit, filter, filterOperator }, true);
  }

  // -------------------------------------------------------------------------
  // Tasks API
  // -------------------------------------------------------------------------

  /** Fetch tasks via Elasticsearch/analytics (primary method used by tasks page) */
  async getAnalyticsTasks(query: any) {
    return this.handleRequest("post", TASK_API_URLS.get_analytics_tasks, query, true);
  }

  /** Get paginated tasks list (legacy) */
  async getTasks(filterObj: any = {}, pageObj: any = { limit: 500, offset: 0 }, showAdhocOnly = false) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const filter = encodeURIComponent(JSON.stringify(filterObj));
    const page = encodeURIComponent(JSON.stringify(pageObj));
    let url = createApiUrl(TASK_API_URLS_LEGACY.get_tasks, { businessTagId: this.workspaceInstance.businessTagId });
    url += `?show_adhoc_only=${showAdhocOnly}&filter=${filter}&page=${page}`;
    return this.handleRequest("get", url, undefined, false);
  }

  /** Get a single task by ID (legacy) */
  async getSingleTask(taskId: number | string) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const url = createApiUrl(TASK_API_URLS_LEGACY.get_single_task, {
      businessTagId: this.workspaceInstance.businessTagId,
      taskId,
    });
    return this.handleRequest("get", url, undefined, false);
  }

  /** Get all tasks (legacy, up to limit) */
  async getAllTasks(pagination: any = { limit: 1000, offset: 0 }) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const page = encodeURIComponent(JSON.stringify(pagination));
    let url = createApiUrl(TASK_API_URLS_LEGACY.get_all_tasks, { businessTagId: this.workspaceInstance.businessTagId });
    url += `?page=${page}`;
    return this.handleRequest("get", url, undefined, false);
  }

  /** Edit a single task (status, assignee, escalation, etc.) */
  async editTask(body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const url = createApiUrl(TASK_API_URLS_LEGACY.edit_task, { businessTagId: this.workspaceInstance.businessTagId });
    return this.handleRequest("post", url, body, true);
  }

  /** Bulk-edit multiple tasks */
  async editBulkTasks(body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const url = createApiUrl(TASK_API_URLS_LEGACY.edit_bulk_tasks, { businessTagId: this.workspaceInstance.businessTagId });
    return this.handleRequest("post", url, body, true);
  }

  /** Create an ad-hoc task */
  async createAdhocTask(body: any) {
    if (!this.workspaceInstance) throw new Error("Workspace not initialized");
    const url = createApiUrl(TASK_API_URLS_LEGACY.create_adhoc_task, { businessTagId: this.workspaceInstance.businessTagId });
    return this.handleRequest("post", url, body, true);
  }
}

export default WorkflowModule;
