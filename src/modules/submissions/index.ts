import { AxiosInstance } from 'axios';
import { API_URLS, API_URLS_LEGACY } from '../../helpers/constants';
import { createApiUrl, getClientType, isLegacyId } from '../../helpers/client';
import { CreateSubmissionDto, SubmissionQueryParams } from '../../interfaces/submission.interface';
import { Workspace } from '../../interfaces/workspace.interface';
import AuthModule from '../auth';

class SubmissionModule {
    constructor(
        private httpClient: AxiosInstance,
        private workspaceInstance?: Workspace,
        private auth?: AuthModule
    ) { }

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
        let response;
        try {
            response = await this.httpClient.request({
                method,
                url,
                data,
                headers: await this.getHeaders(authRequired),
            });
        } catch (error: any) {
            const resData = error?.response?.data;
            const message =
                resData?.message ??
                resData?.error_message ??
                (typeof resData?.error === "string" ? resData.error : null) ??
                error?.message ??
                "Error fetching data";
            throw new Error(message);
        }
        if (
            (response.status === 200 || response.status === 201) &&
            response.data.error === false
        ) {
            return response.data.data || response.data;
        }
        throw new Error(
            response.data?.message ??
                response.data?.error_message ??
                "Error fetching data"
        );
    }

    async create(submissionData: CreateSubmissionDto, queryParams: SubmissionQueryParams = {}): Promise<CreateSubmissionDto> {
        const { skipAutomation = false, skipValidations = false, isDraft = false } = queryParams;

        if (isLegacyId(submissionData?.formId)) {
            if (!this.workspaceInstance) throw new Error("Workspace not initialized");
            let url = createApiUrl(API_URLS_LEGACY.post_submission_legacy, {
                businessTagId: this.workspaceInstance.businessTagId,
                FormID: submissionData.formId,
            });
            if (isDraft) url += '?draft=1';
            return this.handleRequest("post", url, submissionData, false);
        }

        // New (Bifrost) endpoint — UUID formIds.
        const url = createApiUrl(API_URLS.create_submission, { skipAutomation, skipValidations });
        return this.handleRequest("post", url, submissionData, true);
    }

    async fetchById(submissionId: string): Promise<CreateSubmissionDto> {
        const url = createApiUrl(API_URLS.fetch_submission, { id: submissionId });
        return this.handleRequest("get", url, undefined, true);
    }

    async update(submissionId: string, submissionData: Partial<CreateSubmissionDto>, queryParams: SubmissionQueryParams = {}): Promise<CreateSubmissionDto> {
        const { skipAutomation = false, skipValidations = false, isDraft = false } = queryParams;

        // Legacy submission (numeric submissionId) — zvolv-web parity:
        // PUT :businessTagId/forms/:FormID/submissions/:FormSubmissionID[?draft=1]
        // The caller must include `formId` in `submissionData` so we can build the URL.
        if (isLegacyId(submissionId)) {
            if (!this.workspaceInstance) throw new Error("Workspace not initialized");
            if (!submissionData?.formId) {
                throw new Error("submissionData.formId is required when updating a legacy submission");
            }
            let url = createApiUrl(API_URLS_LEGACY.post_submission_legacy, {
                businessTagId: this.workspaceInstance.businessTagId,
                FormID: submissionData.formId,
            });
            url += `/${encodeURIComponent(submissionId)}`;
            if (isDraft) url += '?draft=1';
            return this.handleRequest("put", url, submissionData, true);
        }

        // New (Bifrost) endpoint — UUID submission ids.
        const url = createApiUrl(API_URLS.update_submission, { id: submissionId }, null, { skipAutomation, skipValidations });
        return this.handleRequest("put", url, submissionData, true);
    }
}

export default SubmissionModule;
