import { ZvolvClient } from "./src";

async function testClient() {
    try {
        console.log('ZvolvClient');
        const client = new ZvolvClient('http://twig-me.com');

        const workspace = await client.workspace.init('kapilwf');

        console.log('workspace', workspace);


        const login = await client.auth.login('email', 'pass');

        console.log('login', login);

        const analytics = await client.analytics.search('65c470f6dab3102c930725ca',  {query: {match_all: {}}, from: 0, size: 20, track_total_hits: true});

        console.log('analytics', analytics);
        // Add your code here to process the fetched data
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

testClient();