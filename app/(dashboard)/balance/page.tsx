export const dynamic = "force-dynamic";
import { BalanceClient } from "./balance-client";
import { PlanGate } from "@/components/plan-gate";

export default function BalancePage() {
  return (
    <PlanGate feature="balance">
      <BalanceClient />
    </PlanGate>
  );
}
