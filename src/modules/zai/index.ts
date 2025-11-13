import { AxiosInstance } from "axios";
import { API_URLS } from "../../helpers/constants";
import { createApiUrl, createBifrostUrl } from "../../helpers/client";
import AuthModule from "../auth";
import { Workspace } from "../../interfaces/workspace.interface";

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
}

export default ZGPTServiceModule;
