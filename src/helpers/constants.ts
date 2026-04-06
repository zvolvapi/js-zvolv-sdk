

// Export legacy API URLs as constants
export const API_URLS_LEGACY = {
  login: "/rest/v17/user/login",
  logout: "/rest/v17/user/logout",
  workspace: "/rest/v17/organisation/web/config",
  workflow: "/rest/v17/workflow",
  all_dashboards: "/rest/v17/analytics/reports/get",
  add_dashboard: "/rest/v17/analytics/reports/add",
  edit_dashboard: "/rest/v17/analytics/reports/edit/:reportId",
  delete_dashboard: "/rest/v17/analytics/reports/delete/:reportId",
  add_widget: "/rest/v17/analytics/reports/:reportId/widgets/add",
  delete_widget: "/rest/v17/analytics/reports/:reportId/widgets/delete/:WidgetID",
  update_widget: "/rest/v17/analytics/reports/:reportId/widgets/update/:WidgetID",
  bulk_add_widget: "/rest/v17/analytics/reports/:reportId/widgets/bulkadd",
  edit_widget: "/rest/v17/analytics/reports/widget/edit/:WidgetID",
  search_users: '/rest/v17/search/users',
  get_usergroups_url: '/rest/v17/usergroups/:businessTagId',
  get_all_form: '/rest/v17/org/:businessTagId/workflow/forms/all',
  get_single_form: '/rest/v17/org/:businessTagId/workflow/forms/all/:formID',
  get_data_source: '/rest/v17/workflow/:businessTagId/widget/:WidgetID',
  edit_analytics_report_widget: '/rest/v17/analytics/reports/widget/edit/:WidgetID',
  authData: '/rest/v17/organisation/auth/data',
  get_user_list: '/rest/v17/usergroups/autosearch/:businessTagId',
  get_single_widget: '/rest/v17/analytics/widget/:WidgetID/get',
  fetch_document_templates: '/rest/v17/custom/documents',

  // Databases - Legacy API
  db_get_bulk_uploads: '/rest/v17/bulkupload/resource/:resourceId',
  db_get_bulk_downloads: '/rest/v17/bulkdownload/resource/:resourceId',
  db_bulk_export: '/rest/v17/reports/master/:formId',
  db_bulk_upload: '/rest/v17/bulk/form/:formId/validate/file',
  db_delete_submissions: '/rest/v17/org/:businessTagId/delete/forms/:formId/submissions',
  db_delete_all_submissions: '/rest/v17/org/:businessTagId/delete/forms/:formId/all/submissions',
  db_send_download_summary: '/rest/v17/email/bulkdownload/resource/:resourceId/jobid/:jobId',
  db_single_submission_download: '/rest/v17/:businessTagId/forms/submission/download/:formSubmissionId',
  db_get_forms_lite: '/rest/v17/lite/forms',
  db_get_form_lite: '/rest/v17/lite/forms/:formId',
  db_get_submissions_lite: '/rest/v17/lite/submissions',
  db_create_form_legacy: '/rest/v17/:businessTagId/forms',
  db_put_form_details: '/rest/v17/:businessTagId/formdetails/:formId',
  db_file_upload: '/rest/v17/:businessTagId/:businessTagId/fileupload',
};

// Export API URLs as constants
export const API_URLS = {
  analytics_search: "/analytics/search",
  create_submission: "/submissions",
  fetch_form: "/api/v1/forms/:id",
  fetch_all_forms: "/api/v1/forms/find/all",
  elastic_search: "/api/v1/analytics/search",
  field_unique_values: '/api/v1/analytics/values/unique',
  submissiog_rpc_all: '/api/v1/submissions/:submissionId/find/all',
  update_submission: '/submissions/:id',
  postGPTSearch: '/zwall/v3/agent_manager/',
  singleChatHistory: '/zwall/chat_history/:chatId',
  chatHistory: '/zwall/chat_history/',
  chatFrequency: '/zwall/chat_frequency/',
  gptDocuments: '/zwall/documents/',
  deleteDocument: '/zwall/documents/:document_id',
  defaultDatabase: '/zwall/setup/',
  deleteZaiCache: '/zwall/llm_cache/:id',
  getZaiManual: '/zwall/llm_config/:key',
  getAllPlaygrounds: '/zwall/playground/',
  uploadFile: '/:businessTagId/:businessTagId/fileupload',
  getSingleWidget: '/analytics/widget/:WidgetID/get',

  // Databases - New (Bifrost) API
  db_create_form: '/api/v1/forms',
  db_update_form: '/api/v1/forms',
  db_delete_submissions_grpc: '/api/v1/submissions/delete',
  db_bulk_export_grpc: '/api/v1/submissions/export/:id/:type',
  db_bulk_import: '/api/v1/submissions/fileupload/:id',
  db_data_sync_single: '/api/v1/submissions/sync/request/:id/:onlyCountReq',
  db_data_sync_all: '/api/v1/submissions/sync/request/all',
};

// Task-specific API URLs (New Bifrost/gRPC)
export const TASK_API_URLS = {
  get_analytics_tasks: '/api/v1/analytics/search',
  edit_task: '/api/v1/tasks/edit',
  create_adhoc_task: '/api/v1/tasks/adhoc/create',
};

// Task-specific API URLs (Legacy)
export const TASK_API_URLS_LEGACY = {
  get_tasks: '/rest/v17/user/tasks/get/:businessTagId',
  get_single_task: '/rest/v17/tasks/getsingle/:businessTagId/:taskId',
  get_all_tasks: '/rest/v17/tasks/:businessTagId',
  edit_task: '/rest/v17/tasks/edit/:businessTagId',
  edit_bulk_tasks: '/rest/v17/tasks/bulk/edit/:businessTagId',
  create_adhoc_task: '/rest/v17/org/:businessTagId/workflow/addtask/stage',
};

export const appVariables = {
  loginToken: 'loginToken',
  widgetId: 'WidgetID',
  businessTagID: 'businessTagId',
  reportTagId: 'reportId',
  submissionTagId: 'submissionId',
  businessDomain: 'businessDomain',
  systemSubDomain: 'app',
  errorSubDomain: 'error',
  resourceAccessLocalStorage: 'resourceAccessRaw',
  accessTokenServer: 'X-Auth-Token',
  defaultContentTypeHeader: 'application/json',
  errorInputClass: 'has-error',
  successInputClass: 'has-success',
  ng2SlimLoadingBarColor: 'red',
  ng2SlimLoadingBarHeight: '4px',
  accessTokenLocalStorage: 'accessToken',
};

export const formTypes = {
  GENERIC: 'GENERIC',
  INITIATION: 'INITIATION',
  MASTER: 'MASTER',
  BOT: 'BOT',
  WORKFLOW: 'WORKFLOW',
  ADHOC_TASK: 'ADHOC_TASK'
}

export const taskFields = ["Title", "Description", "Department", "Duration", "Assignee", "Assignee2", "Assignee3", "CurrentEscalationLevel", "Delay", "StartDate", "EndDate", "OriginalStartDate", "OriginalEndDate", "Status", "dStatus", "Priority", "StageCode", "CritPath", "ReworkCount", "SubmittedBy", "SubmittedOn", "CompleteDate"]

