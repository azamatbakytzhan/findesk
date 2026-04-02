import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthSessionProvider } from "@/components/layout/session-provider";
import { TrialBanner } from "@/components/layout/trial-banner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardShell } from "./dashboard-shell";
import { isTrialActive, getTrialDaysLeft } from "@/lib/plan-limits";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where:  { id: session.user.organizationId },
    select: { onboardingCompleted: true },
  });

  const trialActive = isTrialActive(session.user.trialEndsAt);
  const trialDays   = getTrialDaysLeft(session.user.trialEndsAt);
  const showOnboarding = !org?.onboardingCompleted;

  return (
    <AuthSessionProvider>
      <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header orgName={session.user.orgName} />
          {trialActive && <TrialBanner daysLeft={trialDays} />}
          <main className="flex-1 overflow-auto p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
      <DashboardShell showOnboarding={showOnboarding} />
    </AuthSessionProvider>
  );
}
