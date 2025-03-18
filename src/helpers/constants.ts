// Export legacy API URLs as constants
export const API_URLS_LEGACY = {
  login: "/rest/v17/user/login",
  logout: "/rest/v17/user/logout",
  workspace: "/rest/v17/organisation/web/config",
  workflow: "/rest/v17/workflow",
  all_dashboards: "/rest/v17/analytics/reports/get",
  search_users: '/rest/v17/search/users',
  get_usergroups_url: '/rest/v17/usergroups/:businessTagId',
  get_data_source: '/rest/v17/workflow/:businessTagId/widget/:widgetId',
  edit_analytics_report_widget: '/rest/v17/analytics/reports/widget/edit/:WidgetID',
};

// Export API URLs as constants
export const API_URLS = {
  analytics_search: "/analytics/search",
  create_submission: "/submissions",
  fetch_form: "/forms/:id",
  elastic_search: "/api/v1/analytics/search",
  field_unique_values: '/api/v1/analytics/values/unique',
  get_zai_agents: '/zwall/zai_agent/',
  zai_agent_capability: '/zwall/zai_agent_capability/:id',
};

export const appVariables = {
  loginToken: 'loginToken',
  businessTagID: 'businessTagId',
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
