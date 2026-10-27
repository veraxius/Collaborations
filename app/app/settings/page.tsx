"use client";

import { isOwner, useCurrentCompany } from "@/lib/auth-client";
import { IS_PRIVATE } from "@/lib/brand";
import {
  BillingSection,
  DangerSection,
  NotificationsSection,
  PasswordSection,
  ProfileSection,
  TeamSection,
} from "./sections";

export default function SettingsPage() {
  const { company, setCompany } = useCurrentCompany();
  if (!company) return null;
  const owner = isOwner(company);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {!owner && (
        <div className="card">
          <p className="text-sm">
            Signed in as <b>{company.user?.name}</b> ({company.user?.email}) with the <b>{company.user?.role}</b> role at{" "}
            <b>{company.name}</b>.
          </p>
        </div>
      )}

      {owner && <ProfileSection company={company} setCompany={setCompany} />}
      {owner && <NotificationsSection company={company} setCompany={setCompany} />}
      {owner && <TeamSection company={company} />}
      {owner && !IS_PRIVATE && <BillingSection />}
      <PasswordSection />
      {owner && <DangerSection />}
    </div>
  );
}
