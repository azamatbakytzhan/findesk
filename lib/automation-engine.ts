interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  field: string;
  value: string;
}

interface RuleInput {
  id: string;
  name: string;
  conditions: unknown;
  conditionLogic: string;
  actions: unknown;
  priority: number;
  isActive: boolean;
}

type TransactionInput = {
  description?: string | null;
  amount: number;
  counterpartyName?: string | null;
  accountId: string;
};

type ApplyResult = Partial<{ categoryId: string; projectId: string; tags: string[] }>;

function evaluateCondition(condition: Condition, tx: TransactionInput): boolean {
  const rawValue = (() => {
    switch (condition.field) {
      case "description":      return tx.description ?? "";
      case "counterpartyName": return tx.counterpartyName ?? "";
      case "accountId":        return tx.accountId;
      case "amount":           return String(tx.amount);
      default:                 return "";
    }
  })();

  const fieldValue = rawValue.toLowerCase();
  const condValue  = condition.value.toLowerCase();

  switch (condition.operator) {
    case "contains":     return fieldValue.includes(condValue);
    case "equals":       return fieldValue === condValue;
    case "startsWith":   return fieldValue.startsWith(condValue);
    case "greaterThan":  return Number(rawValue) > Number(condition.value);
    case "lessThan":     return Number(rawValue) < Number(condition.value);
    default:             return false;
  }
}

export async function applyAutomationRules(
  tx: TransactionInput,
  rules: RuleInput[]
): Promise<ApplyResult> {
  const sorted = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const conditions = (rule.conditions as Condition[]) ?? [];
    const actions    = (rule.actions    as Action[])    ?? [];

    const matches =
      rule.conditionLogic === "OR"
        ? conditions.some((c)  => evaluateCondition(c, tx))
        : conditions.every((c) => evaluateCondition(c, tx));

    if (matches) {
      const result: ApplyResult = {};
      for (const action of actions) {
        if (action.field === "categoryId") result.categoryId = action.value;
        if (action.field === "projectId")  result.projectId  = action.value;
        if (action.field === "tags")       result.tags       = [action.value];
      }
      return result;
    }
  }

  return {};
}
