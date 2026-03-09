import { getOperatorPortalBuildLabel } from "../config/buildVersion";
import { readSession } from "../services/sessionStorage";

export function ProfileSettingsPage() {
  const session = readSession();
  const buildLabel = getOperatorPortalBuildLabel();
  const initials = session?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="page-grid">
      <header className="page-header hero-card--compact">
        <div>
          <p className="eyebrow">Profile Settings</p>
          <h1>{session?.name ?? "Operator Profile"}</h1>
          <p className="lead">Manage your identity details and review active portal profile information.</p>
        </div>
      </header>

      <article className="content-card profile-settings">
        <div className="profile-settings__identity">
          <span className="profile-settings__avatar">{initials || "HT"}</span>
          <div>
            <strong>{session?.name ?? "Unknown User"}</strong>
            <p>{session?.role ?? "Operator"}</p>
          </div>
        </div>

        <dl className="detail-list profile-settings__details">
          <span>Full Name</span>
          <strong>{session?.name ?? "N/A"}</strong>
          <span>Email</span>
          <strong>{session?.email ?? "N/A"}</strong>
          <span>Role</span>
          <strong>{session?.role ?? "N/A"}</strong>
          <span>User ID</span>
          <strong>{session?.id ?? "N/A"}</strong>
          <span>Portal Build</span>
          <strong>{buildLabel}</strong>
        </dl>
      </article>
    </section>
  );
}

