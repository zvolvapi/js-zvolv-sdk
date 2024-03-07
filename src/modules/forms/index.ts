import { AxiosInstance } from 'axios';
import { API_URLS } from '../../helpers/constants';
import { createApiUrl } from '../../helpers/client';
import { Form } from '../../interfaces/form.interface';

class FormModule {
    constructor(private httpClient: AxiosInstance) { }

    async fetch(formId: string): Promise<Form> {
        try {
            const url = createApiUrl(API_URLS.fetch_form,{ id: formId });
            const response = await this.httpClient.get(url);
            if (response.status === 200 && response.data.error === false) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch form');
            }
        } catch (error) {
            throw new Error('An error occurred while fetching form');
        }
    }
}

export default FormModule;