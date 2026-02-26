

// Export legacy API URLs as constants
export const API_URLS_LEGACY = {
  login: "/rest/v17/user/login",
  logout: "/rest/v17/user/logout",
  workspace: "/rest/v17/organisation/web/config",
  workflow: "/rest/v17/workflow",
  all_dashboards: "/rest/v17/analytics/reports/get",
  add_dashboard: "/rest/v17/analytics/reports/add",
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
  get_user_list: '/rest/v17/usergroups/autosearch/:businessTagId'
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
