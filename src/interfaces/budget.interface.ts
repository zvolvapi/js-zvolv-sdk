export type BudgetScope = "USER" | "DEFAULT" | "WORKSPACE";
export type BudgetPeriod = "DAY" | "MONTH";
export type BudgetLimitType = "MONEY" | "TOKENS";
export type BudgetOnLimit = "BLOCK" | "WARN";
export type BudgetReportPeriod = "daily" | "weekly" | "monthly";
export type BudgetUserStatus = "ok" | "alert" | "exceeded" | "no_limit";

export interface BudgetLimit {
  rule_id?: string;
  source: BudgetScope;
  applies_to?: string;
  user_id?: string;
  period: BudgetPeriod;
  limit_type: BudgetLimitType;
  amount: number;
  topup?: number;
  limit: number;
  used: number;
  remaining?: number;
  pct: number;
  alert_pct?: number;
  on_limit: BudgetOnLimit;
  state: "ok" | "alert" | "exceeded";
  window_start?: string;
  window_end?: string;
  counted_from?: string;
}

export interface BudgetRule {
  id: string;
  scope: BudgetScope;
  user_id?: string;
  period: BudgetPeriod;
  limit_type: BudgetLimitType;
  amount: number;
  alert_pct: number;
  on_limit: BudgetOnLimit;
}

export interface BudgetRuleInput {
  scope: BudgetScope;
  user_id?: string;
  period: BudgetPeriod;
  limit_type: BudgetLimitType;
  amount: number;
  alert_pct?: number;
  on_limit?: BudgetOnLimit;
}

export interface BudgetTopupInput {
  scope?: "USER" | "WORKSPACE";
  user_id?: string;
  amount: number;
  limit_type: BudgetLimitType;
  note?: string;
}

export interface BudgetResetInput {
  scope?: "USER" | "WORKSPACE";
  user_id?: string;
  period: BudgetPeriod;
  note?: string;
}

export interface BudgetReportQuery {
  period: BudgetReportPeriod;
  start_date: string;
  end_date: string;
  user_id?: string;
}

export interface BudgetHistoryQuery {
  user_id?: string;
  limit?: number;
}

export interface BudgetMargin {
  workspace_margin_pct: number | null;
  global_margin_pct: number | null;
  platform_default_margin_pct: number | null;
  effective_margin_pct: number;
}

export class ZaiApiError extends Error {
  constructor(message: string, public status: number = 0, public data?: any) {
    super(message);
    this.name = "ZaiApiError";
  }
}
