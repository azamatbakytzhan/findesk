export type PlanKey = "START" | "BUSINESS" | "FIRST";

export interface PlanLimits {
  maxUsers:         number;
  maxAccounts:      number;
  maxAutomations:   number;
  aiAssistant:      boolean;
  kaspiImport:      boolean;
  telegramBot:      boolean;
  emailDigest:      boolean;
  paymentApprovals: boolean;
  budgetModule:     boolean;
  apiAccess:        boolean;
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  START: {
    maxUsers:         3,
    maxAccounts:      3,
    maxAutomations:   5,
    aiAssistant:      false,
    kaspiImport:      true,
    telegramBot:      false,
    emailDigest:      false,
    paymentApprovals: false,
    budgetModule:     false,
    apiAccess:        false,
  },
  BUSINESS: {
    maxUsers:         10,
    maxAccounts:      10,
    maxAutomations:   20,
    aiAssistant:      true,
    kaspiImport:      true,
    telegramBot:      true,
    emailDigest:      true,
    paymentApprovals: true,
    budgetModule:     true,
    apiAccess:        false,
  },
  FIRST: {
    maxUsers:         Infinity,
    maxAccounts:      Infinity,
    maxAutomations:   Infinity,
    aiAssistant:      true,
    kaspiImport:      true,
    telegramBot:      true,
    emailDigest:      true,
    paymentApprovals: true,
    budgetModule:     true,
    apiAccess:        true,
  },
};

export function hasFeature(plan: string, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[(plan as PlanKey)] ?? PLAN_LIMITS.START;
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}

export function isTrialActive(trialEndsAt: string | Date | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

export function getEffectivePlan(plan: string, trialEndsAt: string | Date | null | undefined): PlanKey {
  if (isTrialActive(trialEndsAt)) return "BUSINESS";
  return (plan as PlanKey) ?? "START";
}

export function getTrialDaysLeft(trialEndsAt: string | Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
