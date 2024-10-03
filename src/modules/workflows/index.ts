import { AxiosInstance } from "axios";
import { getClientType } from "../../helpers/client";
import { API_URLS } from "../../helpers/constants";
import { WorkspaceV2 } from "../../interfaces/workspace.interface";

class WorkflowModule {
	constructor(private httpClient: AxiosInstance, private workspaceInstance?: WorkspaceV2) { }
	getWorkflows() {
		if (!this.workspaceInstance) {
			throw new Error('Workspace not initialized! Please use workspace.initV2() before calling workflow methods');
		}
		if (!this.workspaceInstance.CONFIG.BUSINESS_TAG_ID) {
			throw new Error('Business Tag ID not found in workspace configuration');
		}
		const userData = JSON.parse(localStorage.getItem('userData') || '{}');
		const clientType = getClientType();
		const headers = {
			'jwt': userData.loginToken,
			'device': clientType,
			'businessDomain': this.httpClient.defaults.headers.common['domain'],
			'businessTagId': this.workspaceInstance?.CONFIG.BUSINESS_TAG_ID
		};
		const url = `${this.workspaceInstance.URL}/workflow/${this.workspaceInstance.CONFIG.BUSINESS_TAG_ID}/type?light=true`;
		return this.httpClient.get(url, { headers });
	}

	getAllWidgets(workflowId: string) {
		if (!this.workspaceInstance) {
			throw new Error('Workspace not initialized! Please use workspace.initV2() before calling workflow methods');
		}
		if (!this.workspaceInstance.CONFIG.BUSINESS_TAG_ID) {
			throw new Error('Business Tag ID not found in workspace configuration');
		}
		const userData = JSON.parse(localStorage.getItem('userData') || '{}');
		const clientType = getClientType();
		const headers = {
			'jwt': userData.loginToken,
			'device': clientType,
			'businessDomain': this.httpClient.defaults.headers.common['domain'],
			'businessTagId': this.workspaceInstance?.CONFIG.BUSINESS_TAG_ID
		};
		const query = JSON.stringify({ "WorkflowTypeID": workflowId, "Type": "DASHBOARD" });
		const url = `${this.workspaceInstance.URL}${API_URLS.get_all_widgets}?filter=${encodeURIComponent(query)}`;
		return this.httpClient.get(url, { headers });
	}

}

export default WorkflowModule;
