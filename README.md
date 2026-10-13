# @zestl/zvolv-js-sdk

JavaScript / TypeScript SDK for the Zvolv APIs: workspace, session, forms, submissions,
dashboards, permissions, automations and ZAI.

> Building a UI? Use [`@zestl/zvolv-widgets`](https://www.npmjs.com/package/@zestl/zvolv-widgets)
> on top of this SDK. It owns queries, filters, aggregation, forms and the submission body; the SDK
> gives it the session and the HTTP client. Call the SDK directly only for session, dashboards and
> permissions.

## Install

```bash
npm i @zestl/zvolv-js-sdk
```

## Client, workspace and session

```ts
import { ZvolvClient } from "@zestl/zvolv-js-sdk";

const client = new ZvolvClient("acme.zvolv.in", true);   // host, ssl
// or a full origin: new ZvolvClient("https://acme.zvolv.in")
// or straight from an app's public/config.json ({ HOST, PROTOCOL, DOMAIN }):
// const client = ZvolvClient.fromConfig(config);   // HOST "" → the page's own origin
// client.baseURL tells you where every request goes.
await client.workspace.init("acme");                      // the workspace domain; required before auth
await client.auth.login(email, password);                 // or…
client.auth.init();                                       // …restore the stored session (same-origin apps)
await client.auth.logout();
```

Order matters: `workspace.init` → `auth.*` → everything else (`auth` throws before `workspace.init`).
Inside a Zvolv-hosted app (`/v6/<app>/…`) the user is already signed in: use `auth.init()`; with no
session, send the user to `/v5/login`.

### The signed-in user (encrypted)

The session is stored encrypted (`enc::…`). Decrypt before reading any field:

```ts
import { decryptAuthObject, decryptValue, readUserFromStorage, AUTH_CRYPT_READY_EVENT } from "@zestl/zvolv-js-sdk";

const u: any = decryptAuthObject(client.auth.userInstance);
const role = String(u.profile?.role_details?.role ?? u.role ?? "").toLowerCase();   // "admin" | "builder" | …
const isAdmin = role === "admin";
const userId = Number(u.id ?? u.user_id ?? u.profile?.id);          // what people fields store: [userId]
const groupId = Number(u.userGroupId ?? u.profile?.userGroupId);    // the user's own user group
```

Values encrypted with the server key can be read only after the SDK has fetched it; it fires
`window` event `AUTH_CRYPT_READY_EVENT` (`"zvAuthCryptReady"`) then. Re-read the user on that event.

## Role-based access

| What | Where it lives | How to check |
| --- | --- | --- |
| Admin | the user's `profile.role_details.role === "admin"` | decrypt the user (above) |
| User group (role) | `userGroupId`; roles are user groups | `workflow.getUserGroup`, `workflow.getUserGroupList` |
| Who can open a dashboard | dashboard `ViewPerm` / `EditPerm` (user-group ids, `-1` = everyone); `getDashboards` also returns per-user `permissions` (`VIEW_PERMISSION`, `EDIT_PERMISSION`) | admins see all; else `permissions` holds VIEW or EDIT (a `HideInMobileApp: "YES"` dashboard needs EDIT). `@zestl/zvolv-widgets` has `canViewDashboard` / `visibleDashboardTree` |
| Who can edit a zapp | the zapp's permissions | `workflow.checkPermissions(zappId, ["EDIT_WORKFLOW_TYPE"])` → the granted ops |
| Who can submit / edit a form | the form's role lists (server-enforced) | the submission call fails with the server's message: show it |
| Widget visibility | widget `AllowedUserGroups` (`[-1]` = everyone) | |

`checkPermissions(resourceId, opTypes)` op types: `ADD_MASTER_FORM`, `EDIT_MASTER_FORM`,
`VIEW_MASTER_FORM`, `ADD_MASTER_FORM_SUB`, `EDIT_MASTER_FORM_SUB`, `ADD_ANALYTICS_REPORT`,
`ADD_WORKFLOW_TYPE`, `EDIT_WORKFLOW_TYPE`, `ADD_WORKFLOW_PROJECT`, `DEL_WORKFLOW_PROJECT`.

## Dashboards (an app's pages)

```ts
const list = await client.workflow.getDashboards(String(zappId));      // .data.elements: ReportID, Title, Description, SequenceID, ChildReportIDs, ViewPerm, EditPerm, permissions, MobileOnly, HideInMobileApp
const one  = await client.workflow.getDashboard(String(dashId), String(zappId));   // .data.elements[0].widgets
```

Load a dashboard's widgets when its page opens (not all at start), and render them through
`@zestl/zvolv-widgets` (`normalizeWidget`, `useWidgetData`, `ZvolvWidget`).
Admin tools: `addDashboard`, `editDashboard`, `editDashboardSequence`, `deleteDashboard`,
`addWidget`, `bulkaddWidget`, `editWidget`, `updateWidget`, `deleteWidget`, `getSingleWidget`.

## Forms and submissions

```ts
const form = await client.form.fetch(formId);
const created = await client.submission.create({ formId, elements: [{ label: "Name", value: "Test" }] },
  { skipAutomation: false, skipValidations: false });
const sub = await client.submission.fetchById(submissionId);
await client.submission.update(submissionId, { formId, elements: [...] });
```

For app code prefer `@zestl/zvolv-widgets`: `<ZvolvForm>` for forms, and `fetchSubmission` +
`updateSubmission` / `createSubmission` for in-place edits. They send the exact body the platform
expects (element ids, lookups, people, files, sheets, formulas).

Other form calls on `client.workflow`: `getSingleForm`, `getZappForms(zappId)`, `getAllForm`,
`getSingleSubmission`, `getSubmissionAll`, `getSubmissionHistory`, `batchSubmission`,
`mediaUpload`, `getFormSubmissionFieldValues`, `getFieldDistinctValues`.

## Search and analytics

```ts
await client.workflow.elasticSearch(JSON.stringify(query));          // what @zestl/zvolv-widgets uses
await client.analytics.search(formId, { query: { match_all: {} }, from: 0, size: 20 });
```

Don't hand-write queries in app code; `@zestl/zvolv-widgets` generates them from a data source.

## Automations, agents, ZAI

| Call | Does |
| --- | --- |
| `workflow.invokeTriggers(triggerId, body)` | runs a form/button automation |
| `workflow.invokeNuclioAutomation(name, body)` | runs a ZENO automation |
| `workflow.executeAutomation(id, body)`, `getAutomations()` | zapp automations |
| `workflow.invokeAgent(body, flowId?, agentId?)` | an AI agent |
| `zaiServices.sendMsg(message, playgroundId?)` | ZAI chat |

## Tasks

`workflow.getTasks(filter, page)`, `getSingleTask(id)`, `getAllTasks`, `editTask`, `editBulkTasks`,
`createAdhocTask`, `getAnalyticsTasks`.

## Organisation and theme

`workflow.getOrgConfig`, `getOrgSettings`, `saveOrgSettings`, `getThemeConfig`, `getZappTheme`,
`saveZappTheme`, `getBranding`, `saveBranding`, `uploadBrandingAsset`.

## Local testing

```bash
npm install --global tsx
tsx --no-cache ./sample.ts
```

## License

MIT. See [LICENSE](https://github.com/zvolvapi/js-zvolv-sdk/blob/main/LICENSE).


## Changes in 1.1.0

- `new ZvolvClient(host, ssl = true)` accepts a bare host or a full origin (`https://acme.zvolv.in`, `/rest` and trailing `/` ignored); `ssl` now defaults to `true`. `ZvolvClient.baseUrl(host, ssl)` and `client.baseURL` expose the origin.
- `ZvolvClient.fromConfig({ HOST, PROTOCOL, DOMAIN })` builds a client from an app's `config.json`, so apps call the configured workspace domain, never `localhost`.
- The expired-session response guard is installed once per client (it was added again on every `client.workflow` / `client.form` / … access).
- `submission.fetchById` / `submission.update` (UUID ids) use `/api/v1/submissions/:id`, the same endpoint as `workflow.getSingleSubmission` and `@zestl/zvolv-widgets`.
