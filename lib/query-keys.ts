export const queryKeys = {
  dashboard:    ["dashboard"]                           as const,
  transactions: (filters?: object) => ["transactions", filters] as const,
  cashflow:     (period:  string)  => ["cashflow",  period]    as const,
  pnl:          (period:  string)  => ["pnl",       period]    as const,
  balance:      (date:    string)  => ["balance",   date]      as const,
  budgets:      (period:  string)  => ["budgets",   period]    as const,
  debts:        ["debts"]                               as const,
  calendar:     (month:   string)  => ["calendar",  month]     as const,
  accounts:     ["accounts"]                            as const,
  categories:   ["categories"]                          as const,
  approvals:    ["approvals"]                           as const,
  notifications: ["notifications"]                      as const,
};
