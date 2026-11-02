import { AxiosInstance } from "axios";
import { API_URLS } from "../../helpers/constants";
import { createApiUrl, createBifrostUrl } from "../../helpers/client";
import AuthModule from "../auth";
import { Workspace } from "../../interfaces/workspace.interface";
import {
  BudgetHistoryQuery,
  BudgetMargin,
  BudgetReportQuery,
  BudgetResetInput,
  BudgetRule,
  BudgetRuleInput,
  BudgetTopupInput,
  BudgetUserStatus,
  ZaiApiError,
} from "../../interfaces/budget.interface";

class ZGPTServiceModule {
  constructor(
    private httpClient: AxiosInstance,
    private workspaceInstance?: Workspace,
    private auth?: AuthModule
  ) {}

  // ---------- Helper Methods ----------

  private async getHeaders(authRequired = false): Promise<Record<string, any>> {
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
    }
    return headers;
  }

  private async handleRequest(
    method: "get" | "post" | "put" | "delete",
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
        response.data
      ) {
        return response.data.data || response.data;
      }
      throw new Error("Unexpected response from server");
    } catch (error: any) {
      console.error("API Error:", error);
      throw new Error(error?.message || "Error fetching data");
    }
  }

  async sendMsg(message: any, playground_id?: string) {
    let url = createBifrostUrl(API_URLS.postGPTSearch);
    if (playground_id) {
      url += `?playground_id=${playground_id}`;
    }
    return this.handleRequest("post", url, message, true);
  }

  async mostAskedQuestion() {
    const url = createBifrostUrl(API_URLS.chatFrequency);
    return this.handleRequest("get", url, null, true);
  }

  async sendFeedback(chatId: any, body: any) {
    const url = createBifrostUrl(API_URLS.singleChatHistory, [{ chatId }]);
    return this.handleRequest("put", url, body, true);
  }

  async getAllPinnedMessages() {
    const params = [{ pinned: true }];
    const url = createBifrostUrl(API_URLS.chatHistory, null, null, params);
    return this.handleRequest("get", url, null, true);
  }

  async deleteLogs(chatId: any) {
    const url = createBifrostUrl(API_URLS.singleChatHistory, [{ chatId }]);
    return this.handleRequest("delete", url, null, true);
  }

  async getAllChats() {
    const url = createBifrostUrl(API_URLS.chatHistory);
    const res = await this.handleRequest("get", url, null, true);
    return res.data || res;
  }

  async getZaiManual() {
    const url = createBifrostUrl(API_URLS.getZaiManual, [{ key: "zai_manual" }]);
    return this.handleRequest("get", url, null, true);
  }

  async listOfDocuments() {
    const url = createBifrostUrl(API_URLS.gptDocuments);
    const res = await this.handleRequest("get", url, null, true);
    return res.data || res;
  }

  async uploadDocuments(body: any) {
    const url = createBifrostUrl(API_URLS.gptDocuments);
    const res = await this.handleRequest("post", url, body, true);
    return res.data || res;
  }

  async deleteDocument(documentId: any) {
    const url = createBifrostUrl(API_URLS.deleteDocument, [{ document_id: documentId }]);
    return this.handleRequest("delete", url, null, true);
  }

  async uploadFile(blob: any) {
    const url = createApiUrl(API_URLS.uploadFile);
    const headers = await this.getHeaders();
    const formData = new FormData();
    formData.append("file", blob);

    try {
      const response = await this.httpClient.post(url, formData, { headers });
      return response.data;
    } catch (error) {
      console.error("File Upload Error:", error);
      throw error;
    }
  }

  async getSingleWidget(widgetId: any) {
    const url = createApiUrl(API_URLS.getSingleWidget, [{ WidgetID: widgetId }]);
    const res = await this.handleRequest("get", url, null, true);
    return res?.data?.elements?.[0];
  }

  async deleteCache(cacheId: any) {
    const url = createBifrostUrl(API_URLS.deleteZaiCache, [{ id: cacheId }]);
    return this.handleRequest("delete", url, null, true);
  }

  async getAllPlayground() {
    const url = createBifrostUrl(API_URLS.getAllPlaygrounds);
    const res = await this.handleRequest("get", url, null, true);
    return res.data || res;
  }


  private budgetErrorMessage(body: any, fallback: string): string {
    const detail = body?.detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail) && detail.message) {
      return String(detail.message);
    }
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (typeof body?.message === "string" && body.message) return body.message;
    if (typeof body?.error === "string" && body.error) return body.error;
    return fallback;
  }

  private async budgetRequest<T = any>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any
  ): Promise<T> {
    let response;
    try {
      response = await this.httpClient.request({
        method,
        url,
        data,
        headers: await this.getHeaders(true),
      });
    } catch (error: any) {
      const body = error?.response?.data;
      throw new ZaiApiError(
        this.budgetErrorMessage(body, error?.message || "Something went wrong. Please try again."),
        Number(error?.response?.status) || 0,
        body
      );
    }
    const body = response.data;
    if (body && typeof body === "object" && (body.error === true || body.detail)) {
      throw new ZaiApiError(
        this.budgetErrorMessage(body, "Something went wrong. Please try again."),
        Number(body.status_code) || response.status,
        body
      );
    }
    return (body && typeof body === "object" && "data" in body ? body.data : body) as T;
  }

  async getBudgetUsage(userId?: string | number) {
    const query = userId != null && userId !== "" ? { user_id: userId } : null;
    return this.budgetRequest("get", createBifrostUrl(API_URLS.budgetUsage, null, null, query));
  }

  async getBudgetUsers(status?: BudgetUserStatus) {
    const query = status ? { status } : null;
    return this.budgetRequest<any[]>("get", createBifrostUrl(API_URLS.budgetUsers, null, null, query));
  }

  async getBudgetWorkspace() {
    return this.budgetRequest("get", createBifrostUrl(API_URLS.budgetWorkspace));
  }

  async getBudgetReport(query: BudgetReportQuery) {
    const params: Record<string, any> = {
      period: query.period,
      start_date: query.start_date,
      end_date: query.end_date,
    };
    if (query.user_id != null && query.user_id !== "") params.user_id = query.user_id;
    return this.budgetRequest<any[]>("get", createBifrostUrl(API_URLS.budgetReport, null, null, params));
  }

  async getBudgetHistory(query: BudgetHistoryQuery = {}) {
    const params: Record<string, any> = {};
    if (query.user_id != null && query.user_id !== "") params.user_id = query.user_id;
    if (query.limit != null) params.limit = query.limit;
    return this.budgetRequest<any[]>(
      "get",
      createBifrostUrl(API_URLS.budgetHistory, null, null, Object.keys(params).length ? params : null)
    );
  }

  async getBudgetRules() {
    return this.budgetRequest<BudgetRule[]>("get", createBifrostUrl(API_URLS.budgetRules));
  }

  async putBudgetRule(body: BudgetRuleInput) {
    return this.budgetRequest<BudgetRule>("put", createBifrostUrl(API_URLS.budgetRules), body);
  }

  async deleteBudgetRule(ruleId: string) {
    return this.budgetRequest("delete", createBifrostUrl(API_URLS.budgetRule, [{ rule_id: ruleId }]));
  }

  async postBudgetTopup(body: BudgetTopupInput) {
    return this.budgetRequest("post", createBifrostUrl(API_URLS.budgetTopup), body);
  }

  async postBudgetReset(body: BudgetResetInput) {
    return this.budgetRequest("post", createBifrostUrl(API_URLS.budgetReset), body);
  }

  async getBudgetEnforcement() {
    return this.budgetRequest<{ enabled: boolean }>("get", createBifrostUrl(API_URLS.budgetEnforcement));
  }

  async putBudgetEnforcement(enabled: boolean) {
    return this.budgetRequest<{ enabled: boolean }>("put", createBifrostUrl(API_URLS.budgetEnforcement), {
      enabled,
    });
  }

  async getBudgetMargin() {
    return this.budgetRequest<BudgetMargin>("get", createBifrostUrl(API_URLS.budgetMargin));
  }

  async putBudgetMargin(marginPct: number | null) {
    return this.budgetRequest<BudgetMargin>("put", createBifrostUrl(API_URLS.budgetMargin), {
      margin_pct: marginPct,
    });
  }
}

export default ZGPTServiceModule;
