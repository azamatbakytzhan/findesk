import { ApprovalsClient } from "./approvals-client";
import { PlanGate } from "@/components/plan-gate";

export default function ApprovalsPage() {
  return (
    <PlanGate feature="paymentApprovals">
      <ApprovalsClient />
    </PlanGate>
  );
}
