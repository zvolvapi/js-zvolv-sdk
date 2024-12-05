import { AxiosInstance } from "axios";
import { API_URLS } from "../../helpers/constants";
import { createApiUrl } from "../../helpers/client";
import { SearchResponse } from "../../interfaces/analytics.interface";

class AnalyticsModule {
  constructor(private httpClient: AxiosInstance) {}

  async search(formId: string, query: object): Promise<SearchResponse> {
    try {
      const url = createApiUrl(API_URLS.analytics_search);
      const response = await this.httpClient.post(url, { formId, query });
      if (response.status === 200 && response.data.error === false) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Analytics search failed");
      }
    } catch (error) {
      throw new Error("An error occurred during analytics search");
    }
  }
}

export default AnalyticsModule;
