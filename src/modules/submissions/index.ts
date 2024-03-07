import { AxiosInstance } from 'axios';
import { API_URLS } from '../../helpers/constants';
import { createApiUrl } from '../../helpers/client';
import { CreateSubmissionDto,SubmissionQueryParams } from '../../interfaces/submission.interface';

class SubmissionModule {
    constructor(private httpClient: AxiosInstance) { }

    async create(submissionData: CreateSubmissionDto, queryParams: SubmissionQueryParams = {}): Promise<CreateSubmissionDto> {
        const { skipAutomation = false, skipValidations = false } = queryParams;
        try {
            const url = createApiUrl(API_URLS.create_submission, { skipAutomation, skipValidations });
            const response = await this.httpClient.post(url, submissionData);

            if (response.status === 201 && response.data.error === false) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Submission creation failed');
            }
        } catch (error) {
            throw new Error('An error occurred during submission creation');
        }
    }
}

export default SubmissionModule;
