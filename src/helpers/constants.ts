// Export legacy API URLs as constants
export const API_URLS_LEGACY = {
  login: "/rest/v17/user/login",
  logout: "/rest/v17/user/logout",
  workspace: "/rest/v17/organisation/web/config",
  workflow: "/rest/v17/workflow",
  all_dashboards: "/rest/v17/analytics/reports/get",
};

// Export API URLs as constants
export const API_URLS = {
  analytics_search: "/analytics/search",
  create_submission: "/submissions",
  fetch_form: "/forms/:id",
  elastic_search: "/api/v1/analytics/search",
};
