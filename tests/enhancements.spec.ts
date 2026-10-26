import 'mocha';
import { expect } from 'chai';
import axios from 'axios';
import CryptoJS from 'crypto-js';

import {
  ZvolvClient,
  decryptValue,
  decryptAuthObject,
  isReadable,
  mergeReadable,
  setServerKey,
  isAdminRole,
  buildSession,
  buildMediaUrl,
  isBlockedUpload,
  BLOCKED_UPLOAD_EXTENSIONS,
  BatchSubmissionError,
} from '../src/index';
import WorkflowModule from '../src/modules/workflow';

const SERVER_KEY = 'test-server-key';
const encS = (v: string) => 'enc::s::' + CryptoJS.AES.encrypt(v, SERVER_KEY).toString();
const encLegacy = (v: string) => 'enc::' + CryptoJS.AES.encrypt(v, SERVER_KEY).toString();

describe('1. decrypt helpers', () => {
  afterEach(() => setServerKey(null));

  it('returns already-readable values unchanged', () => {
    expect(decryptValue('Awnish')).to.equal('Awnish');
    expect(decryptValue('admin')).to.equal('admin');
    expect(decryptValue(42)).to.equal(42);
    expect(decryptValue(null)).to.equal(null);
    expect(decryptValue(undefined)).to.equal(undefined);
    expect(decryptValue('')).to.equal('');
  });

  it('decrypts server-key values once the key is set, and keeps them until then', () => {
    const c = encS('Administrator');
    expect(decryptValue(c)).to.equal(c);
    expect(isReadable(decryptValue(c))).to.equal(false);
    setServerKey(SERVER_KEY);
    expect(decryptValue(c)).to.equal('Administrator');
  });

  it('decrypts legacy untagged enc:: values', () => {
    setServerKey(SERVER_KEY);
    expect(decryptValue(encLegacy('a@b.com'))).to.equal('a@b.com');
  });

  it('decrypts a mixed object (some plain, some encrypted)', () => {
    setServerKey(SERVER_KEY);
    const u = decryptAuthObject({ name: 'Plain Name', userGroupId: encS('17'), profile: { role_details: { role: encS('admin') } } });
    expect(u).to.deep.equal({ name: 'Plain Name', userGroupId: 17, profile: { role_details: { role: 'admin' } } });
  });

  it('mergeReadable never replaces a readable field with ciphertext', () => {
    const merged = mergeReadable({ name: encS('x'), role: 'admin' }, { name: 'Real', role: encS('y') });
    expect(merged).to.deep.equal({ name: 'Real', role: 'admin' });
  });
});

describe('2. session / role detection', () => {
  afterEach(() => setServerKey(null));

  for (const role of ['admin', 'ADMIN', 'Administrator', ' administrator ', 'Super Admin', 'super_admin']) {
    it(`"${role}" is admin`, () => expect(isAdminRole(role)).to.equal(true));
  }
  for (const role of ['builder', 'member', '', null, undefined, 'adminx', encS('admin')]) {
    it(`${JSON.stringify(role)} is not admin`, () => expect(isAdminRole(role)).to.equal(false));
  }

  it('builds a session from a login-shaped user', () => {
    const s = buildSession(
      { userId: '12', name: 'A', email: 'a@x', userGroupId: 5, profile: { role_details: { role: 'Administrator' } } },
      [{ groupId: 9, title: 'Ops' }, { groupId: 5, title: 'Self' }]
    );
    expect(s).to.include({ userId: 12, name: 'A', email: 'a@x', role: 'Administrator', isAdmin: true, groupId: 5, ready: true });
    expect(s.groupIds).to.deep.equal([5, 9]);
  });

  it('is not ready (and not admin) while the role is still encrypted; ready once the key arrives', () => {
    const stored = { userId: 3, userGroupId: 4, profile: { role_details: { role: encS('admin') } } };
    let s = buildSession(stored);
    expect(s.ready).to.equal(false);
    expect(s.isAdmin).to.equal(false);
    setServerKey(SERVER_KEY);
    s = buildSession(stored);
    expect(s.ready).to.equal(true);
    expect(s.isAdmin).to.equal(true);
  });
});

describe('3. media URL helper', () => {
  it('builds /media/{domain}/{mediaKey}', () => {
    expect(buildMediaUrl('https://acme.zvolv.in', 'acme', 'abc/123.png')).to.equal('https://acme.zvolv.in/media/acme/abc/123.png');
    expect(buildMediaUrl('https://acme.zvolv.in/', 'acme', { mediaKey: 'k1' }, 'tok')).to.equal('https://acme.zvolv.in/media/acme/k1?jwt=tok');
  });
  it('returns full URLs unchanged and "" for nothing', () => {
    expect(buildMediaUrl('https://a', 'acme', 'https://cdn/x.png')).to.equal('https://cdn/x.png');
    expect(buildMediaUrl('https://a', 'acme', { media: 'https://cdn/y.png' })).to.equal('https://cdn/y.png');
    expect(buildMediaUrl('https://a', 'acme', '')).to.equal('');
    expect(buildMediaUrl('https://a', 'acme', null)).to.equal('');
  });
  it('client.mediaUrl uses the client origin and workspace domain', () => {
    const client = ZvolvClient.fromConfig({ HOST: 'acme.zvolv.in', AUTHENTICATION: 'PRIVATE' });
    expect(client.privateMedia).to.equal(true);
    (client as any)._workspace = { workspaceInstance: { businessDomain: 'acme', businessTagId: '1' } };
    expect(client.mediaUrl('k9', { withToken: false })).to.equal('https://acme.zvolv.in/media/acme/k9');
  });
});

/** An axios instance whose adapter records requests and fires upload progress. */
function fakeHttp(handler: (config: any) => any) {
  const calls: any[] = [];
  const http = axios.create({
    baseURL: 'https://acme.zvolv.in',
    adapter: async (config: any) => {
      calls.push(config);
      if (config.onUploadProgress) {
        config.onUploadProgress({ loaded: 50, total: 100 });
        config.onUploadProgress({ loaded: 100, total: 100 });
      }
      const data = handler(config);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
  return { http, calls };
}

const workspace: any = { businessDomain: 'acme', businessTagId: '1' };
const auth: any = { userInstance: { loginToken: 't' }, session: { userId: 7 } };

describe('4/5. mediaUpload', () => {
  it('posts to /api/v1/media/upload, reports real progress and returns mediaKey + url', async () => {
    const { http, calls } = fakeHttp(() => ({ error: false, data: { mediaKey: 'mk1', mediaName: 'a.png' } }));
    const wf = new WorkflowModule(http, workspace, auth, (ref, o) => buildMediaUrl('https://acme.zvolv.in', 'acme', ref, o?.withToken === false ? null : 't'));
    const progress: number[] = [];
    const res = await wf.mediaUpload(new Blob(['x']) as any, { onProgress: (p) => progress.push(p.percent) });
    expect(calls[0].url).to.equal('/api/v1/media/upload');
    expect(progress).to.deep.equal([50, 100]);
    expect(res.mediaKey).to.equal('mk1');
    expect(res.data).to.deep.equal({ mediaKey: 'mk1', mediaName: 'a.png' });
    expect(res.url).to.equal('https://acme.zvolv.in/media/acme/mk1');
    expect(res.previewUrl).to.equal('https://acme.zvolv.in/media/acme/mk1?jwt=t');
  });

  it('still accepts the old (formData, zappId) call', async () => {
    const { http, calls } = fakeHttp(() => ({ error: false, data: { mediaKey: 'mk2' } }));
    const wf = new WorkflowModule(http, workspace, auth);
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'report.pdf');
    const res = await wf.mediaUpload(fd, '1156');
    expect(calls[0].url).to.equal('/api/v1/media/upload?zapid=1156');
    expect(res.data.mediaKey).to.equal('mk2');
  });

  it('rejects with the server message, and when no mediaKey comes back', async () => {
    const wf1 = new WorkflowModule(fakeHttp(() => ({ error: true, message: 'File type not allowed' })).http, workspace, auth);
    let err: any;
    try { await wf1.mediaUpload(new Blob(['x']) as any); } catch (e) { err = e; }
    expect(err?.message).to.equal('File type not allowed');

    const wf2 = new WorkflowModule(fakeHttp(() => ({ error: false, data: {} })).http, workspace, auth);
    err = undefined;
    try { await wf2.mediaUpload(new Blob(['x']) as any); } catch (e) { err = e; }
    expect(err?.message).to.match(/no mediaKey/);
  });

  it('refuses blocked extensions (incl. .zip) before sending', async () => {
    const { http, calls } = fakeHttp(() => ({ error: false, data: { mediaKey: 'x' } }));
    const wf = new WorkflowModule(http, workspace, auth);
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'bundle.ZIP');
    let err: any;
    try { await wf.mediaUpload(fd); } catch (e) { err = e; }
    expect(err?.message).to.match(/\.zip/);
    expect(calls.length).to.equal(0);
    expect(isBlockedUpload('a.exe')).to.equal(true);
    expect(isBlockedUpload('a.pdf')).to.equal(false);
    expect(BLOCKED_UPLOAD_EXTENSIONS).to.include('zip');
  });
});

describe('6. user-group membership lookup', () => {
  it('queries the USERGROUPS index for the user and maps groups', async () => {
    const { http, calls } = fakeHttp(() => ({ error: false, data: { elements: [
      { groupID: 11, title: 'Ops' }, { groupID: 12, title: 'Sales' }, { groupID: 11, title: 'Ops' },
    ] } }));
    const wf = new WorkflowModule(http, workspace, auth);
    const groups = await wf.getUserGroupsForUser();
    expect(groups).to.deep.equal([{ groupId: 11, title: 'Ops' }, { groupId: 12, title: 'Sales' }]);
    const body = JSON.parse(calls[0].data);
    expect(calls[0].url).to.equal('/api/v1/analytics/search');
    expect(body.indexType).to.equal('USERGROUPS');
    expect(body.indexKey).to.equal('usergroups');
    expect(body.query.query.bool.must[0].terms['userInfo.userID']).to.deep.equal([7]);
    expect(body.query.query.bool.filter.term._routing).to.equal('acme');
    await wf.getUserGroupsForUser(7);
    expect(calls.length).to.equal(1); // cached
  });
});

describe('7. batchSubmission', () => {
  it('sends chunks of 100 and collects submissionIds', async () => {
    let n = 0;
    const { http, calls } = fakeHttp((cfg) => {
      const ops = JSON.parse(cfg.data).operations;
      return { error: false, data: { submissionIds: ops.map(() => `id${n++}`) } };
    });
    const wf = new WorkflowModule(http, workspace, auth);
    const ops = Array.from({ length: 230 }, () => ({ operation: 'CREATE' as const, formId: 'f', elements: [] }));
    const res = await wf.batchSubmission({ operations: ops });
    expect(calls.map((c) => JSON.parse(c.data).operations.length)).to.deep.equal([100, 100, 30]);
    expect(calls[0].url).to.equal('/api/v1/submissions/batch?skipSyncRequest=true');
    expect(res.submissionIds.length).to.equal(230);
  });

  it('turns "<msg> operation : N" into an operationIndex across chunks', async () => {
    let call = 0;
    const { http } = fakeHttp(() => (call++ === 0
      ? { error: false, data: { submissionIds: ['a'] } }
      : { error: true, message: 'Amount is required operation : 3' }));
    const wf = new WorkflowModule(http, workspace, auth);
    const ops = Array.from({ length: 150 }, () => ({ operation: 'CREATE' as const, formId: 'f', elements: [] }));
    let err: any;
    try { await wf.batchSubmission(ops); } catch (e) { err = e; }
    expect(err).to.be.instanceOf(BatchSubmissionError);
    expect(err.message).to.equal('Amount is required');
    expect(err.operationIndex).to.equal(102);
    expect(err.savedSubmissionIds).to.deep.equal(['a']);
  });

  it('validates operations', async () => {
    const wf = new WorkflowModule(fakeHttp(() => ({})).http, workspace, auth);
    let err: any;
    try { await wf.batchSubmission([{ operation: 'UPDATE', formId: 'f', elements: [] } as any]); } catch (e) { err = e; }
    expect(err?.message).to.match(/submissionId/);
  });
});
