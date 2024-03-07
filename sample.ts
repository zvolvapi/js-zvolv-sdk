import { ZvolvClient } from "./src";

async function testClient() {
    try {
        console.log('ZvolvClient');
        const client = new ZvolvClient('http://twig-me.com');

        const workspace = await client.workspace.init('kapilwf');

        console.log('workspace', workspace);


        const login = await client.auth.login('email', 'pass');

        console.log('login', login);

        const analytics = await client.analytics.search('65c470f6dab3102c930725ca', { query: { match_all: {} }, from: 0, size: 20, track_total_hits: true });

        console.log('analytics', analytics);
        // Fetch form details with the specified form ID
        const formId = '65c470f6dab3102c930725ca'; // Replace with the appropriate form ID
        const form = await client.form.fetch(formId);
        console.log('form', form);

        // Submission creation data
        const submissionData = {
            formId: '65c470f6dab3102c930725ca', // Replace with the appropriate formId
            elements: [
                {
                    label: 'Name',
                    value: 'Test'
                }
            ]
        };

        // Define query parameters for the submission creation request.
        // If not provided, default values of false will be used for skipAutomation and skipValidations.
        const queryParams = {
            skipAutomation: true,
            skipValidations: false,
        };

        // Create a submission using the submissionData
        const createdSubmission = await client.submission.create(submissionData, queryParams);

        console.log('createdSubmission', createdSubmission);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

testClient();