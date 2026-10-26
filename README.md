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

### The signed-in user

Read the user through `auth.session`; don't parse the stored user yourself.

```ts
const s = await client.auth.loadSession();   // waits for the server key, loads group memberships
// s = { userId, name, email, role, isAdmin, groupId, groupIds, ready }
if (s.isAdmin) { /* … */ }                   // true for "admin", "ADMIN", "Administrator", "Super Admin"
widgetAccess({ isAdmin: s.isAdmin, groupIds: s.groupIds });

client.auth.session;   // synchronous snapshot — fields still encrypted are empty and ready === false
await client.auth.ready();   // resolves once stored values can be decrypted (≤ 8 s, never rejects)
```

`groupId` is the user's own user group; `groupIds` is that group plus every group the user is a
member of (`workflow.getUserGroupsForUser`, see below).

#### How the stored session is encrypted

The session in `localStorage` mixes encrypted and plain fields, depending on when it was written:

| Value | Key | Readable |
| --- | --- | --- |
| plain text / number | — | always (returned unchanged) |
| `enc::d::…` (loginToken, sharedToken, and PII written before the server key arrived) | this browser's device key | immediately |
| `enc::s::…` (email, name, role, userId, userGroupId) | server key `AUTH_CRYPT` from `organisation/auth/data` | after `auth.ready()` |
| `enc::…` without a tag (older data) | server key, then device key | best effort |

`decryptValue(v)` / `decryptAuthObject(obj)` follow that table: a value that is already readable
comes back unchanged, a value whose key isn't loaded yet comes back as the `enc::…` string. Use
`isReadable(v)` to tell, or await `auth.ready()` first. The SDK also fires `window` event
`AUTH_CRYPT_READY_EVENT` (`"zvAuthCryptReady"`) when the key arrives. On a page reload the server
key is fetched again, so right after `auth.init()` the `s::` fields are not readable yet — that
is why a signed-in admin could briefly look like a nameless member; `loadSession()` waits for it.

## Role-based access

| What | Where it lives | How to check |
| --- | --- | --- |
| Admin | the user's `profile.role_details.role` (`admin`, `ADMIN`, `Administrator`…) | `auth.session.isAdmin` |
| User group (role) | `userGroupId`; roles are user groups; a user can be a member of several | `auth.session.groupIds`, `workflow.getUserGroupsForUser()` |
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

### Many records at once: `batchSubmission`

The supported way to create or update many records in one go (zvolv-web's sheet / table widget uses
it). Don't hand-write `/api/v1/submissions/batch`.

```ts
const { submissionIds } = await client.workflow.batchSubmission({
  operations: [
    { operation: "CREATE", formId, elements: [{ label: "Name", value: "A" }] },
    { operation: "UPDATE", formId, submissionId, elements: [{ label: "Name", value: "B" }] },
  ],
});   // second argument skipSyncRequest, default true
```

- `elements` is the same array a single `submission.create` sends. A `CREATE` can carry
  `parentFormSubmissionId` to attach the new record to a parent (sheet / table rows).
- The SDK sends 100 operations per request, in order, and returns every id.
- On failure it throws `BatchSubmissionError`: `message` is the server's reason,
  `operationIndex` the 0-based position of the refused operation in your list (the server reports
  it as `"<reason> operation : N"`), `savedSubmissionIds` what earlier requests already saved.

## Files (media)

```ts
const res = await client.workflow.mediaUpload(file, {
  zappId,                                        // optional (?zapid=)
  onProgress: ({ loaded, total, percent }) => setPct(percent),
  signal: controller.signal,                     // optional AbortController signal
});
// res = { error: false, data, mediaKey, url, previewUrl }
field.value = [res.data];                        // store `data` as-is (what zvolv-web stores)
img.src = res.previewUrl;                        // show now

client.mediaUrl(mediaKeyOrFile);                 // URL of a stored file, from its mediaKey
client.mediaUrl(file, { withToken: true });      // + ?jwt=… for PRIVATE workspaces
```

**Contract**

- Endpoint: `POST /api/v1/media/upload`, multipart, the file under `"file"` (same as zvolv-web).
  Pass a `File`/`Blob`, or a `FormData` that already holds it. `mediaUpload(formData, zappId)` still works.
- Progress comes from the browser's own XHR upload events (axios `onUploadProgress`), so you get
  real `progress` → `load` → `loadend`. Don't wrap or replace `XMLHttpRequest`: a shim that calls
  `onload` itself instead of dispatching `load`/`loadend`/`progress` makes the upload hang without an error.
- The promise resolves only after the server answers `error: false` **with a `mediaKey`**. It
  rejects with the server's own message otherwise, or with an `AbortError` when `signal` fires. A
  resolved upload has been stored — don't retry it.
- The response has no `media` URL. Build it from `mediaKey` with `client.mediaUrl` (or use
  `res.url` / `res.previewUrl`): `{origin}/media/{businessDomain}/{mediaKey}`.
- `url` carries no token and is safe to store. `previewUrl` adds `?jwt=` when the workspace's
  `config.json` has `AUTHENTICATION: "PRIVATE"` (`fromConfig` reads it into `client.privateMedia`);
  don't store it.

**Limits**

- Refused extensions: `BLOCKED_UPLOAD_EXTENSIONS` (exported), including executables, scripts and
  installers (`exe`, `js`, `sh`, `php`, `msi`…), disk images (`iso`, `vhd`), archives `zip`, `bz2`,
  `z`, `ace`, `cab`, and macro/add-in Office types (`xlam`, `ppam`, `xlm`…). **`.zip` is refused by
  the media API.** `mediaUpload` checks this first and throws without sending; `isBlockedUpload(name)`
  lets a picker check earlier.
- Everything not on that list is let through by the client, as in zvolv-web: images, PDF,
  Word/Excel/PowerPoint (`docx`, `xlsx`, `pptx`, `doc`, `xls`, `ppt`), `csv`, text, audio and video.
  The server can still refuse a file (size, type); `mediaUpload` then rejects with its message.
- Per field, the form element's `attributes` narrow this further: `allowedFileTypes` (an `accept`
  string, `*/*` = any), `allowedFileCount` (0 = unlimited) and `allowedFileMaxSize` (in **KB**,
  0 = unlimited). `@zestl/zvolv-widgets` applies them; check them yourself in a custom picker.
- Legacy file fields with a `cardID` (`UPLOAD_FILE_IMAGE`) use `dbFileUpload` instead.

## User groups

```ts
const groups = await client.workflow.getUserGroupsForUser();     // the signed-in user's groups
// [{ groupId, title }] — or getUserGroupsForUser(userId), { refresh: true } to bypass the cache
```

It reads the `USERGROUPS` search index (`userInfo.userID` → `groupID`), cached per user. Apps
should not write that query themselves. `auth.loadSession()` uses it for `groupIds`.

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

| Call | Does |
| --- | --- |
| `workflow.getAnalyticsTasks(query)` | the signed-in user's tasks (search index; catches up a few seconds after a change) |
| `getTasks(filter, page)`, `getAllTasks`, `getSingleTask(id)` | legacy lists / one task + its status log (`elements[0]`, `elements[1].logs`) |
| `editTask(body)`, `editBulkTasks(body)` | `{ TaskID, Status \| UserGroupIDLevel1..3 \| StartDate \| EndDate }` |
| `createAdhocTask(body)` | `{ Title, Description, form_id, WorkflowTypeID, StartDate, Duration, UserGroupIDLevel1, MidgardSubmissionID }` — Start + Duration, never all three with EndDate; for a new-framework form save the record first and pass its id as `MidgardSubmissionID` |
| `adhocTaskStatusChange(wid, taskId, midgardSubmissionId)` | after an ad-hoc task's record is submitted (zvolv-web does this; without it the task stays Active) |
| `getWorkflowTasks(wid, filter?)` | a project's tasks (`{ stageCodes }` for dependencies) |
| `searchUserGroups(text)` | assignee / escalation picker (`select` = UserGroupID) |
| `getFormsOfType("MASTER")` + `getAllNewForms(query)` | the forms a task can be created on |
| `getValkyrieTask(uuid)`, `editValkyrieTask(uuid, status)` | new-engine tasks (UUID ids) |
| `getSubmissionFormId(submissionId)` | the form a task's record belongs to |

Task writes use the legacy (jwt) headers, so they also work from a local dev origin (no `domain` header in the CORS preflight).
Apps should not call these directly: `@zestl/zvolv-widgets` wraps them (`useTaskList`, `TaskDetail`, `TaskView`, `useCreateTaskFlow`).

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


## Changes in 1.2.0

- **Decryption**: `decryptValue` / `decryptAuthObject` document and test that readable values come
  back unchanged; untagged `enc::…` values are decrypted (server key, then device key); new
  `isReadable`, `hasEncryptedFields`, `mergeReadable`. `auth.init()` never replaces a readable
  in-memory field with ciphertext from storage; the `AUTH_CRYPT` fetch retries transient errors.
- **Session**: `auth.ready()`, `auth.session` and `auth.loadSession()` give `{ userId, name, email,
  role, isAdmin, groupId, groupIds, ready }`; `isAdmin` accepts `admin` / `ADMIN` / `Administrator` /
  `Super Admin`. `isAdminRole`, `normalizeRole`, `buildSession` exported.
- **Media**: `client.mediaUrl(ref, { withToken })`, `buildMediaUrl`; `fromConfig` reads
  `AUTHENTICATION` into `client.privateMedia`.
- **Upload**: `mediaUpload(file | formData, { zappId, onProgress, signal })` uses
  `POST /api/v1/media/upload` (was `/media/upload`), reports real progress, resolves with
  `{ data, mediaKey, url, previewUrl }`, rejects with the server's message or when no `mediaKey`
  comes back, and refuses blocked extensions (incl. `.zip`) before sending.
- **User groups**: `workflow.getUserGroupsForUser(userId?)`.
- **Batch**: `batchSubmission` is typed, validated, chunked by 100, returns `{ submissionIds }` and
  throws `BatchSubmissionError` with `operationIndex`.

## Changes in 1.1.0

- `new ZvolvClient(host, ssl = true)` accepts a bare host or a full origin (`https://acme.zvolv.in`, `/rest` and trailing `/` ignored); `ssl` now defaults to `true`. `ZvolvClient.baseUrl(host, ssl)` and `client.baseURL` expose the origin.
- `ZvolvClient.fromConfig({ HOST, PROTOCOL, DOMAIN })` builds a client from an app's `config.json`, so apps call the configured workspace domain, never `localhost`.
- The expired-session response guard is installed once per client (it was added again on every `client.workflow` / `client.form` / … access).
- `submission.fetchById` / `submission.update` (UUID ids) use `/api/v1/submissions/:id`, the same endpoint as `workflow.getSingleSubmission` and `@zestl/zvolv-widgets`.
