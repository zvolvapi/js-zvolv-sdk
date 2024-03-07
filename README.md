<!-- # js-zvolv-sdk
Javascript Software Development Kit for Zvolv APIs


To test using node and typescript.
Install tsx globally
npm install --global tsx   

Run sample script using tsx
tsx --no-cache ./sample.ts  -->

# ZvolvClient SDK

ZvolvClient SDK is a JavaScript Software Development Kit for interacting with the Zvolv API.


To test using node and typescript. Install tsx globally npm install --global tsx Run sample script using tsx tsx --no-cache ./sample.ts 


## Installation

To install ZvolvClient SDK, use npm:

```bash
npm i zvolv-sdk

```
# Usage
## Initialize ZvolvClient

constructor(baseURL: string)

Initializes the ZvolvClient with the base URL of the Zvolv server.

Once the package is installed, you can import the library using import or require approach:

```bash
import { ZvolvClient } from "zvolv-client-sdk";

const client = new ZvolvClient('http://twig-me.com');

```

## Initialize Workspace

methods for interacting with workspaces.

```bash

try {
    const workspace = await client.workspace.init('kapilwf');
} catch (error) {
    console.error('Error initializing workspace:', error);
}

```
## Perform Authentication

methods for authentication.

```bash
try {
    const login = await client.auth.login('email', 'pass');
} catch (error) {
    console.error('Error performing login:', error);
}
```
## Perform Analytics Search
methods for performing analytics-related operations.

```bash
try {
    const analytics = await client.analytics.search('65c470f6dab3102c930725ca', { query: { match_all: {} }, from: 0, size: 20, track_total_hits: true });
} catch (error) {
    console.error('Error performing analytics search:', error);
}

```
## Fetch Form

methods for fetching form details.

```bash
try {
    const formId = '65c470f6dab3102c930725ca'; // Replace with the appropriate form ID
    const form = await client.form.fetch(formId);
} catch (error) {
    console.error('Error fetching form:', error);
}
```
## Create Submission

methods for creating submissions.

Define query parameters for the submission creation request.

If not provided, default values of false will be used for skipAutomation and skipValidations.

```bash
try {
    const submissionData = {
        formId: '65c470f6dab3102c930725ca', // Replace with the appropriate formId
        elements: [
            {
                label: 'Name',
                value: 'Test'
            }
        ]
    };

    const queryParams = {
        skipAutomation: true,
        skipValidations: false,
    };

    const createdSubmission = await client.submission.create(submissionData, queryParams);
} catch (error) {
    console.error('Error creating submission:', error);
}
```

# License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/zvolvapi/js-zvolv-sdk/blob/main/LICENSE) file for details.
