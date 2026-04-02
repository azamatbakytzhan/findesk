import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthSessionProvider } from "@/components/layout/session-provider";
import { TrialBanner } from "@/components/layout/trial-banner";
import { isTrialActive, getTrialDaysLeft } from "@/lib/plan-limits";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const trialActive = isTrialActive(session.user.trialEndsAt);
  const trialDays   = getTrialDaysLeft(session.user.trialEndsAt);

  return (
    <AuthSessionProvider>
      <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header orgName={session.user.orgName} />
          {trialActive && <TrialBanner daysLeft={trialDays} />}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
