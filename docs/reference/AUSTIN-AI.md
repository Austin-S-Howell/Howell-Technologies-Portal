# AUSTIN-AI

## Purpose
Authoritative, end-to-end spec of the UI/UX + data behavior implemented in this repo so another AI agent can reproduce it in a new codebase with high fidelity.

## Repo
- Root: `/Users/austinhowell/Desktop/hog`

## Product Goals
- Dashboard-style app with desktop + mobile flows.
- Mobile is a full-page, app-like experience (no pop-up dialogs for core tasks).
- Desktop favors modals/side-by-side layouts.
- Preferences and layout persist per user and per device.

## Core UX Decisions
- **Mobile navigation** uses a fixed bottom nav; page content must end above it.
- **Mobile report selection** uses its own page; return/back on mobile only.
- **Users management** is full page on mobile, segmented Active/Inactive, with an easy status toggle.
- **Manage homepage** lets users drag/resize widgets; saves per-user + per-device layout.
- **Desktop manage users/reports** uses discard changes logic and desktop-style full-width footer buttons.
- **Modal forms** use consistent input + select styling (same padding, borders, focus ring).

## Key UI/Feature Requirements
### Homepage
- Summary cards and Customer Overview widgets are draggable/resizable (Manage Homepage mode only).
- Layout is stored by user and by device (desktop vs mobile).
- Desktop: Manage Homepage is a round settings/cog button top-right; Save/Cancel appear inline.
- Mobile: Manage Homepage is a full-width bottom button; Save/Discard full-width.
- Summary cards never overlap: enforce min height and adequate row height.
- Desktop grid responsiveness:
  - Desktop uses the same 12-column grid across multiple breakpoints so layouts keep their ratio as the window shrinks.
  - Only switches to the 1-column mobile layout at `<= 40rem` (mobile).
- Manage Homepage supports adding **Custom Widgets** via an "Add Widget" action:
  - First custom widget type shipped: a Power BI visual export list (scrollable list of rows filtered by column/value).
  - Example use: Highlands report, filter `NinjaOne Status = Online`, show a list of online devices.
  - Custom widgets are deletable while managing:
    - Trash icon appears on the widget card in Manage Homepage mode.
    - Deletes remove the widget definition from `homepageLayout.<device>.customWidgets` and its layout entry from `homepageLayout.<device>.overview`.
    - Grid drag is cancelled for `.widget-delete` and widget list elements so taps scroll/click instead of dragging the whole widget.
  - Add Widget dialog:
    - Widget title input starts blank.
    - Title is required to add the widget (inline error + red highlight if missing).
    - Any failure to load metadata (report/pages/visuals/columns) shows:
      - Toast error
      - Inline field error under the relevant dropdown/input
      - Red highlight on the relevant dropdown/input

### Reports
- Mobile: IT Reports page becomes a dedicated hub page with selections and navigation (no modal).
- Mobile: Create and Manage report are full-page and include Return.
- Report list supports favorites and drag/drop order; saves to preferences.
- In report viewer, header uses Return left and title centered; Return is mobile-only.
- Full screen report behavior (no re-embed):
  - Full screen does NOT unmount/remount PowerBI embeds.
  - Instead, the existing report container is positioned `fixed` to fill the viewport.
  - A refresh icon calls the embedded report instance `refresh()` (fallback `reload()`).

### Users
- Mobile: Users page lists Active and Inactive users; selecting a user opens manage page without list.
- Active status uses full-width pill button: green for active, red for inactive.
- Roles are split into Active/Inactive columns; role buttons are large and easy to tap.
- Delete button is inside scrollable body; Back/Save are sticky in footer.
- Desktop: Manage Users uses same footer layout (Cancel/Save full width), Delete at bottom of scroll.

### Enhancements (Report Options)
- Options renamed to **Enhancements**.
- Items: **Action Bar** and **Copilot**.
- Pills are **red with X** when off, **green with check** when on.

### Charts
- Gross Margin chart uses a smooth area line SVG (not a basic polyline).
- Chart is styled with gradient fill + smooth path.

### Device Detection
- A utility exists to detect device type (mobile) for UX decisions.

## Data Contracts
### `/api/user-preferences` Payload
- `userName`, `firstName`, `lastName`, `jobTitle`, `roles`, `isActive`, `reports`, `homepageLayout`.
- `reports` array: include `favorite` boolean + order fields.
- `homepageLayout` shape:
  - `desktop.summaryCards`, `desktop.overview`
  - `mobile.summaryCards`, `mobile.overview`
  - `desktop.customWidgets`, `mobile.customWidgets` (array of custom widget definitions)
  - Each is an array of react-grid-layout items `{i,x,y,w,h}`.

### `homepageLayout.customWidgets` (Custom Widgets)
- Stored per device under `homepageLayout.desktop.customWidgets` / `homepageLayout.mobile.customWidgets`.
- Each widget definition is a plain JSON object. Current type(s):
  - `type: "powerbi_visual_list"`

Example widget definition:
```json
{
  "id": "w-1712345678901-acde12",
  "type": "powerbi_visual_list",
  "title": "NinjaOne Online",
  "reportRouteId": "164e80e5-e964-44d0-a6fa-00b0935cff4c",
  "pageName": "ReportSection123abc",
  "visualName": "visual123abc",
  "filterColumn": "NinjaOne Status",
  "filterValue": "Online",
  "displayColumn": "Device Name",
  "maxRows": 200
}
```

Runtime behavior:
- UI embeds the selected Power BI report *offscreen* and calls `visual.exportData(...)` to retrieve CSV from the chosen visual.
- CSV is parsed on the client; rows are filtered where `filterColumn` matches `filterValue` (case-insensitive, trimmed).
- The widget renders a scrollable list of the `displayColumn` values.
- This is intended for table/matrix visuals that support export.
- Limitations (important):
  - This does not query the dataset directly. It can only read data that Power BI allows exporting from a visual.
  - The chosen visual must support export (typically table/matrix). If export is disabled by tenant/report settings or visual type, the widget will stay empty or show an error.
  - Data returned is usually summarized and may be truncated by Power BI export limits.
- UX:
  - Widget shows a spinner while connecting/exporting so users can tell it is actively loading.
  - Widget auto-exports once on initial load, then stops. Users can manually refresh via the refresh icon.
  - Initial auto-export is implemented with finite retries so the widget usually has data immediately without requiring manual refresh.
  - Widget times out after 10 seconds without data:
    - Shows `Error getting information` message
    - Red status dot next to refresh
    - Successful export flips dot to green

## Frontend State Rules
- Redux store holds `profile` including `homepageLayout` from login.
- Login uses `userPrincipalName` from Microsoft profile; emails matched case-insensitive.
- Discard changes logic compares initial snapshot vs current edit state.

## Key Files (for recreation)
- Homepage layout + widget logic: `ui/src/components/Homepage/Homepage.jsx`
- Homepage styling: `ui/src/components/Homepage/Homepage.css`
- Mobile overrides: `ui/src/components/Homepage/Homepage.mobile.css`
- Add Widget dialog: `ui/src/components/Homepage/AddHomepageWidgetDialog.jsx`
- Power BI visual list widget: `ui/src/components/Widgets/PowerBIVisualListWidget.jsx`
- Dashboard forms + routes: `ui/src/components/Homepage/DashboardLayout.jsx`
- Reports hub + styles: `ui/src/components/Pages/ReportsHub.jsx`, `ReportsHub.css`
- Users hub + styles: `ui/src/components/Pages/UsersHub.jsx`, `UsersHub.css`
- Users manage page: `ui/src/components/Pages/UsersManagePage.jsx`
- Login + prefs: `ui/src/components/Login/Login.jsx`
- Global styles (modal + pills): `ui/src/global.css`
- Redux profile: `ui/src/store/userSlice.js`
- Device detect: `ui/src/utils/device.js`
- Chart: `ui/src/components/CustomerOverview/MarginLineChart.jsx`
- Reports helpers: `ui/src/services/reportUtils.js`

## Frontend Behavior Summary (What It Feels Like)
- Mobile is full-screen and touch-first. All management tasks are pages with Return.
- Desktop is dashboard-centric with dialogs and faster access.
- The homepage is customizable per user and per device.
- Reports & Users flows are coherent across desktop/mobile, but optimized for each.

## Tech Dependencies
- `react-grid-layout`
- `react-resizable`

## Recent Update Log (2026-02-09)
- Added discard changes logic for Manage Users/Reports (desktop + mobile).
- Updated enhancements UI to red/green pills with X/check + renamed to Enhancements.
- Fixed summary widget overlap (row height + min height clamp).
- Upgraded gross margin chart to smooth area chart.
- Login now stores homepage layout in Redux.

## Backend Changes (Required)
### Data Model
- `UserPreference` now includes:
  - `reports` (JSON array, report order + favorite)
  - `homepageLayout` (JSON for react-grid-layout per device)
  - `isActive` (boolean)
- `ReportPreference` table/model removed and references updated to use `UserPreference.reports`.

### Preferences API
- `/api/user-preferences` now accepts/returns `homepageLayout`, `reports`, and `isActive`.
- Reports persistence uses `reports` in `UserPreference` (favorite + order saved here).

### Users Admin API
- `/api/admin/users` now includes and updates `isActive`.

### Seeding
- Seed user includes `isActive = true` and reads env vars:
  - `HOG_SEED_USER_EMAIL`
  - `HOG_SEED_USER_JOB_TITLE`
  - `HOG_SEED_USER_ROLES`

### Credentials Store
- `credentials_store.py` fallback: if `/app/api/mockCredentials.json` is not writable, write to `/tmp/mockCredentials.json`.

### Migration / Cleanup
- Added columns `reports`, `homepageLayout`, `isActive` to `userpreference` table.
- Dropped `reportpreference` table.

## Recent Update Log (2026-02-09)
- Backend aligned with frontend: preferences stored under `UserPreference`, `reportPreference` removed, and `isActive` supported.

## Recent Update Log (2026-03-04)
### Power BI: Browse Available Reports + Import
- Added backend endpoint `GET /api/reports/available` in `connecters/api/routers/reports.py`.
- Endpoint requirements:
  - valid session cookie (`require_session_user`)
  - `Authorization: Bearer <powerbi_access_token>`
- Report discovery behavior:
  - fetches direct reports from `/v1.0/myorg/reports`
  - fetches workspaces from `/v1.0/myorg/groups` and then `/groups/{id}/reports`
  - combines + deduplicates by `reportId`
  - normalizes `reportId`, `groupId`, `reportName`, `embedUrl`
  - returns `skipped.missingIds`, `skipped.missingGroupId`, and `workspacePermissionError`
  - logs fetch counts + skip counts for troubleshooting
- UI behavior in `ui/src/components/Homepage/DashboardLayout.jsx`:
  - Added **Browse Reports** action under IT Reports navigation for all users.
  - Browse flow is a standalone modal popup (`Browse Available Reports`) rather than nested inside Manage Reports.
  - Includes search by report name/report ID/group ID, multi-select, duplicate disable state, and `Add Selected`.
  - Import action immediately persists reports to user preferences (no extra Save click needed).
  - For each selected import, UI attempts `/api/reports/embed-url`; if unavailable, it falls back to building an embed URL from report metadata.
- Azure permission note:
  - Full workspace report visibility depends on delegated scope `Workspace.Read.All` (plus `Report.Read.All`) and admin consent.

### Reports UX: Favorites + Ordering
- Favorites can be toggled from:
  - left navigation report star icon
  - Manage Reports favorite chip
- Persistence logic in `persistReports(...)` now runs `prioritizeFavoriteReports(...)` before saving:
  - favorites are moved to the top
  - relative order within favorites and non-favorites is preserved
  - `orderID` is re-sequenced after sort

### Manage Reports Layout (Desktop)
- Desktop Manage Reports uses a wider, two-pane editing layout:
  - report list on the left
  - selected report editor on the right
- This is implemented inside `renderManageReportsForm(...)` and associated CSS classes under Homepage styles.

### Global Loading Overlay (All Endpoint Calls)
- Added a global network loading system:
  - `ui/src/services/networkLoading.js` monkey-patches `window.fetch`
  - tracks active request count
  - publishes state via `subscribeToNetworkLoading`
- Added `GlobalLoadingOverlay` mounted in `ui/src/main.jsx`.
- Resulting behavior:
  - one consistent spinner overlay appears for any in-flight API call (save, delete, import, login/session, etc.)
  - removed duplicate login spinner overlay behavior (single global indicator remains)

### Microsoft Auth + User Provisioning Defaults
- Microsoft profile parsing (`ui/src/services/microsoftAuth.js`):
  - uses `userPrincipalName` as canonical identity
  - falls back to `givenName` when `displayName` is missing
  - defaults `jobTitle` to `Analyst` when missing
- Session/login behavior (`ui/src/components/Login/Login.jsx` + `connecters/api/routers/auth.py`):
  - verifies ID token against normalized principal
  - auto-provisions user if absent from preferences
  - first/last name resolution:
    - use explicit `firstName`/`lastName` when present
    - otherwise split `displayName` into first/last
  - default provisioning permissions:
    - `read_reports=True`
    - `edit_reports=True`
    - `create_users=False`
    - `is_active=True`
  - default missing job title: `Analyst`

### BigQuery Compatibility Hardening
- Fixed reports/homepage JSON insert/update compatibility in `connecters/api/services/user_preferences_store.py`:
  - uses `_value_expr_for_json_or_string(...)` to support either JSON-typed or STRING-typed BigQuery columns
  - serializes report/homepage payloads as JSON strings and parses only when target column type is JSON
- This prevents failures like: `Value has type JSON which cannot be inserted into column reports, which has type STRING`.

### Build Version + Login Legal Footer
- Build version is manually controlled in repo at:
  - `ui/src/constants/build-version.js`
  - current value is set to `1.0.0`
- Dashboard sidebar shows `Build v...` under “Highlands Oncology Group Analytics”.
- Login page includes legal footer with:
  - copyright
  - “Authorized use only”
  - external link to Notice of Privacy Practices PDF:
    - `https://highlandsoncology.com/wp-content/uploads/Final-Notice-of-Private-Practices-Revision-12026.pdf`
- Login page no longer shows build version (dashboard-only).

### Key Files Added/Updated for These Changes
- `connecters/api/routers/reports.py`
- `connecters/api/routers/auth.py`
- `connecters/api/services/preferences_service.py`
- `connecters/api/services/user_preferences_store.py`
- `ui/src/components/Homepage/DashboardLayout.jsx`
- `ui/src/components/Homepage/Homepage.css`
- `ui/src/components/Homepage/Homepage.mobile.css`
- `ui/src/components/Login/Login.jsx`
- `ui/src/components/Login/Login.css`
- `ui/src/services/microsoftAuth.js`
- `ui/src/services/networkLoading.js`
- `ui/src/components/LoadingOverlay/GlobalLoadingOverlay.jsx`
- `ui/src/components/LoadingOverlay/LoadingOverlay.jsx`
- `ui/src/main.jsx`
- `ui/src/constants/build-version.js`

## Implementation Examples (React + CSS)
Below are copy-paste-friendly examples for recreating the same behavior without the original files.

### 1) Device Detection Utility
```js
// ui/src/utils/device.js
export const isMobileViewport = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(max-width: 40rem)').matches;
```

### 2) Homepage Widget Layout (react-grid-layout)
```jsx
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGrid = WidthProvider(Responsive);
const SUMMARY_ROW_HEIGHT = 60; // ensures card min-height fits
const OVERVIEW_ROW_HEIGHT = 36;
const MIN_SUMMARY_HEIGHT = 2;

const normalizeSummaryLayout = (layout) =>
  Array.isArray(layout)
    ? layout.map((item) => ({
        ...item,
        h: Math.max(item.h ?? MIN_SUMMARY_HEIGHT, MIN_SUMMARY_HEIGHT)
      }))
    : [];

// Example default layouts
const defaultDesktopSummary = cards.map((card, i) => ({
  i: card.title,
  x: (i % 3) * 4,
  y: Math.floor(i / 3) * 2,
  w: 4,
  h: 2
}));

return (
  <ResponsiveGrid
    className="summary-grid"
    layouts={{ lg: desktopLayout, xs: mobileLayout }}
    cols={{ lg: 12, xs: 1 }}
    breakpoints={{ lg: 1200, xs: 0 }}
    rowHeight={SUMMARY_ROW_HEIGHT}
    margin={[16, 16]}
    isDraggable={isManageHomepage}
    isResizable={isManageHomepage}
    compactType="vertical"
    preventCollision={false}
    allowOverlap={false}
    onLayoutChange={(layout, layouts) => {
      const next = isMobileViewport() ? layouts.xs : layouts.lg;
      handleLayoutChange(normalizeSummaryLayout(next));
    }}
  >
    {cards.map((card) => (
      <div key={card.title} className="summary-card">
        ...
      </div>
    ))}
  </ResponsiveGrid>
);
```

### 3) Persist Homepage Layout in Preferences (per device)
```js
const payload = {
  userName,
  roles,
  firstName,
  lastName,
  jobTitle,
  isActive,
  reports,
  homepageLayout: {
    desktop: { summaryCards: desktopLayout, overview: desktopOverviewLayout },
    mobile: { summaryCards: mobileLayout, overview: mobileOverviewLayout }
  }
};

await fetch(`${PREFS_API}/api/user-preferences`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(payload)
});
```

### 4) Mobile Bottom Nav + Content Safe Area
```css
/* Ensure content stops above bottom nav */
.homepage-mobile-content {
  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom));
}

.mobile-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4.5rem;
}
```

### 5) Manage Users: Discard Changes Logic
```js
const [initialEditUserState, setInitialEditUserState] = useState(null);

const snapshotUser = (user) =>
  user
    ? {
        email: user.email || '',
        roles: user.roles || [],
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        jobTitle: user.jobTitle || '',
        isActive: user.isActive ?? true,
        password: ''
      }
    : null;

const hasUserChanges = JSON.stringify(currentUserState) !== JSON.stringify(initialEditUserState);

const discardUserChanges = () => {
  if (!initialEditUserState) return;
  setEditUserPassword(initialEditUserState.password || '');
  setEditUserRoles(initialEditUserState.roles || []);
  setEditFirstName(initialEditUserState.firstName || '');
  setEditLastName(initialEditUserState.lastName || '');
  setEditJobTitle(initialEditUserState.jobTitle || '');
  setEditUserActive(initialEditUserState.isActive ?? true);
};
```

### 6) Manage Reports: Discard Changes Logic
```js
const [initialEditReportState, setInitialEditReportState] = useState(null);

const snapshotReport = (report) =>
  report
    ? {
        reportName: report.reportName || '',
        embedUrl: report.reportURL || '',
        reportId: report.reportId || '',
        groupId: report.groupId || '',
        actionBar: !!report.enableActionBar,
        copilot: !!report.enableCopilot
      }
    : null;

const hasReportChanges = JSON.stringify(currentReportState) !== JSON.stringify(initialEditReportState);

const discardReportChanges = () => {
  if (!initialEditReportState) return;
  setEditReportName(initialEditReportState.reportName || '');
  setEditReportEmbedUrl(initialEditReportState.embedUrl || '');
  setEditReportId(initialEditReportState.reportId || '');
  setEditReportGroupId(initialEditReportState.groupId || '');
  setEditReportActionBar(!!initialEditReportState.actionBar);
  setEditReportCopilot(!!initialEditReportState.copilot);
};
```

### 7) Enhancements Pill UI (Red X / Green Check)
```css
.role-grid { display: grid; gap: 0.75rem; }
.role-option input { position: absolute; opacity: 0; }
.role-option span {
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.55rem 0.85rem;
  border-radius: 999rem;
  border: 1px solid #e4b7b7;
  background: #fdecec;
  color: #9b3d3d;
}
.role-option span::after { content: '✕'; font-weight: 800; }
.role-option input:checked + span {
  background: #0f8f7d;
  border-color: #0f8f7d;
  color: #ffffff;
}
.role-option input:checked + span::after { content: '✓'; }
```

### 8) Users: Active/Inactive Columns (Mobile)
```jsx
<div className="role-columns">
  <div className="role-column">
    <h4>Active</h4>
    {roles.filter(r => activeRoles.includes(r)).map(role => (
      <button className="role-pill role-pill-active" onClick={() => toggleRole(role)}>
        {role}
      </button>
    ))}
  </div>
  <div className="role-column">
    <h4>Inactive</h4>
    {roles.filter(r => !activeRoles.includes(r)).map(role => (
      <button className="role-pill role-pill-inactive" onClick={() => toggleRole(role)}>
        {role}
      </button>
    ))}
  </div>
</div>
```

### 9) Mobile Users: Status Pill Button
```css
.status-pill {
  width: 100%;
  border-radius: 999rem;
  padding: 0.6rem 1rem;
  font-weight: 700;
}
.status-pill--active { background: #0f8f7d; color: #fff; }
.status-pill--inactive { background: #c44d4d; color: #fff; }
```

### 10) Mobile Footer Buttons (Back/Save fixed)
```css
.inline-form-panel .modal-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -0.4rem 0.8rem rgba(8, 32, 41, 0.08);
}
.inline-form-panel .modal-footer-row { display: flex; }
.inline-form-panel .modal-footer-row button { flex: 1; }
```

### 11) Report Favorites + Order Save (Preferences)
```js
const updatedReports = reportList.map((r, i) => ({
  ...r,
  orderID: i,
  favorite: r.favorite === true
}));

await fetch(`${PREFS_API}/api/user-preferences`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ userName, reports: updatedReports })
});
```

### 12) Login: Read Preferences Into Redux
```js
const prefs = await fetchUserPreferences(userEmail, profile);

dispatch(setProfile({
  firstName: prefs.firstName || profile.firstName || '',
  lastName: prefs.lastName || profile.lastName || '',
  jobTitle: prefs.jobTitle || profile.jobTitle || '',
  roles: prefs.roles?.length ? prefs.roles : ['ViewReports'],
  userName: userEmail,
  reports: Array.isArray(prefs.reports) ? prefs.reports : [],
  homepageLayout: prefs.homepageLayout || {}
}));
```

## Expanded Architecture + File Structure
### Suggested Project Structure (React + API)
```text
repo/
├─ ui/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ Homepage/
│  │  │  │  ├─ Homepage.jsx
│  │  │  │  ├─ Homepage.css
│  │  │  │  ├─ Homepage.mobile.css
│  │  │  │  └─ DashboardLayout.jsx
│  │  │  ├─ Pages/
│  │  │  │  ├─ ReportsHub.jsx
│  │  │  │  ├─ ReportsHub.css
│  │  │  │  ├─ ReportsCreatePage.jsx
│  │  │  │  ├─ ReportsManagePage.jsx
│  │  │  │  ├─ UsersHub.jsx
│  │  │  │  ├─ UsersHub.css
│  │  │  │  └─ UsersManagePage.jsx
│  │  │  ├─ CustomerOverview/
│  │  │  │  └─ MarginLineChart.jsx
│  │  │  ├─ Login/
│  │  │  │  ├─ Login.jsx
│  │  │  │  └─ Login.css
│  │  │  └─ LoadingOverlay/
│  │  ├─ store/
│  │  │  ├─ store.js
│  │  │  ├─ userSlice.js
│  │  │  ├─ authSlice.js
│  │  │  └─ recentSlice.js
│  │  ├─ services/
│  │  │  ├─ microsoftAuth.js
│  │  │  └─ reportUtils.js
│  │  ├─ utils/
│  │  │  └─ device.js
│  │  ├─ global.css
│  │  └─ main.jsx
│  └─ package.json
├─ connecters/
│  └─ api/
│     ├─ routers/
│     ├─ models/
│     ├─ services/
│     └─ main.py
└─ docker-compose.yml
```

### Page Layout Overview
```text
DashboardLayout
├─ Header (desktop)
├─ Main Content
│  ├─ Homepage
│  │  ├─ Summary Cards Grid (drag + resize)
│  │  └─ Customer Overview Grid (drag + resize)
│  ├─ Reports Hub (mobile page)
│  │  ├─ Report list (favorites + order)
│  │  ├─ Create Report page (mobile)
│  │  └─ Manage Reports page (mobile)
│  └─ Users Hub (mobile page)
│     ├─ Active Users
│     ├─ Inactive Users
│     └─ Manage User page (mobile)
└─ Bottom Nav (mobile only)
```

## Data Model + DB Plan
### Tables
#### `userpreference`
```sql
CREATE TABLE userpreference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userName TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL DEFAULT '',
  lastName TEXT NOT NULL DEFAULT '',
  jobTitle TEXT NOT NULL DEFAULT '',
  roles JSONB NOT NULL DEFAULT '[]',
  isActive BOOLEAN NOT NULL DEFAULT true,
  reports JSONB NOT NULL DEFAULT '[]',
  homepageLayout JSONB NOT NULL DEFAULT '{}',
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now()
);
```

#### `reportpreference` (Removed)
- This table is removed; all report state now lives on `userpreference.reports`.

### Reports JSON Schema (stored in `userpreference.reports`)
```json
[
  {
    "reportName": "Quarterly Sales",
    "reportURL": "https://app.powerbi.com/reportEmbed?...",
    "reportId": "<report-guid>",
    "groupId": "<group-guid>",
    "orderID": 0,
    "favorite": true,
    "actionBarEnabled": true,
    "reportCopilotInEmbed": false
  }
]
```

### Homepage Layout JSON Schema (stored in `userpreference.homepageLayout`)
```json
{
  "desktop": {
    "summaryCards": [
      {"i": "Total Sales", "x": 0, "y": 0, "w": 4, "h": 2}
    ],
    "overview": [
      {"i": "overview-total", "x": 0, "y": 0, "w": 4, "h": 2}
    ]
  },
  "mobile": {
    "summaryCards": [
      {"i": "Total Sales", "x": 0, "y": 0, "w": 1, "h": 2}
    ],
    "overview": [
      {"i": "overview-total", "x": 0, "y": 0, "w": 1, "h": 2}
    ]
  }
}
```

## API Plan
### `POST /api/user-preferences`
- Request: `{ userName, firstName, lastName, jobTitle, roles, isActive, reports, homepageLayout }`
- Response: same shape, plus `isNewUser` when applicable.

### `GET /api/admin/users`
- Returns list of users, including `isActive`, `roles`, `jobTitle`.

### `PUT /api/admin/users`
- Updates selected user’s `roles`, `isActive`, and profile details.

## UI Examples (Layout Mock)
### Homepage (Desktop)
```text
+------------------------- Dashboard Header -------------------------+
|   [Settings ⚙]                                              [User] |
+--------------------------------------------------------------------+
|  Summary Cards (drag/resize grid)                                  |
|  +---------+ +---------+ +---------+                               |
|  | Card A  | | Card B  | | Card C  |                               |
|  +---------+ +---------+ +---------+                               |
|                                                                    |
|  Customer Overview (drag/resize grid)                              |
|  +------------------+ +------------------+                         |
|  |  Chart / KPIs     | |   Chart / KPIs   |                         |
|  +------------------+ +------------------+                         |
|  +--------------------------------------+                           |
|  |            Large Trend Chart         |                           |
|  +--------------------------------------+                           |
+--------------------------------------------------------------------+
```

### Mobile Reports Hub
```text
+----------------- Reports Hub -----------------+
| < Return                     Reports          |
|  [Favorites] [All]                            |
|  - Report A      ★                           |
|  - Report B                                  |
|  - Report C      ★                           |
|                                              |
|  [Create Report]                              |
|  [Manage Reports]                             |
+----------------------------------------------+
| Home  Reports  User   (Bottom Nav)           |
+----------------------------------------------+
```

### Mobile Manage User
```text
+---------------- Manage Users ----------------+
| < Return             Manage Users            |
|                                              |
|  Email: user@company.com                      |
|  Status: [ ACTIVE ] (pill, full width)        |
|                                              |
|  Roles:                                       |
|  Active:   [Role 1] [Role 2]                  |
|  Inactive: [Role 3] [Role 4]                  |
|                                              |
|  [Delete] (inside scroll area)                |
+----------------------------------------------+
| [Back]                [Save] (sticky footer) |
+----------------------------------------------+
```

## Migration Plan
1. Add `reports`, `homepageLayout`, `isActive` columns to `userpreference`.
2. Migrate existing `reportpreference` data into `userpreference.reports`.
3. Drop `reportpreference` table.
4. Update API + frontend to read/write `userpreference` only.

## Testing / Validation Checklist
- Login returns preferences and Redux stores `homepageLayout`.
- Mobile: create/manage pages are full screen and return properly.
- Manage homepage: drag/resize works, save persists, discard resets.
- Manage users: active/inactive pill toggles and save updates backend.
- Manage reports: enhancements pills reflect action bar + copilot.

## Full Rebuild Blueprint (Routes, APIs, State, Auth, Env)
This section is intended to be sufficient for recreating both `hog/ui` and `hog/connecters` from scratch for a prompt like “Create me a portal application.”

### Routes (Frontend)
```text
/hog/login               -> Login page (Microsoft auth + dev bypass)
/hog/home                -> Homepage dashboard
/hog/reports             -> Reports hub (mobile view)
/hog/reports/create       -> Create report (mobile page)
/hog/reports/manage       -> Manage reports (mobile page)
/hog/users               -> Users hub (mobile view)
/hog/users/manage/:email  -> Manage user (mobile page)
```
Notes:
- Desktop uses modal/inline forms; mobile uses full-page routes.
- Back/Return buttons are mobile-only.

### UI Navigation Rules
- Mobile bottom nav is fixed and shows `Home`, `IT Reports`, `User`.
- Active nav item shifts upward slightly (icon pop).
- Content padding-bottom must reserve nav height + safe area.

### Auth Flow (Frontend)
1. User enters email on login screen.
2. `signInWithMicrosoft()` triggers OAuth.
3. `getMicrosoftProfile()` returns profile (contains `userPrincipalName`).
4. `getMicrosoftIdToken()` returns ID token.
5. POST `/api/session` with `{ email, idToken }` to establish session cookie.
6. POST `/api/user-preferences` to fetch/save preferences.
7. Store preferences in Redux `profile`.

#### Dev Bypass
- If `VITE_ENABLE_DEV_BYPASS=true`, allow login via `/api/dev/session` with `X-Dev-Bypass-Token`.

### Required Env Vars (Frontend)
```bash
VITE_PREFS_API_URL=http://localhost:8000
VITE_ENABLE_DEV_BYPASS=false
VITE_DEV_BYPASS_TOKEN=...
```

### Redux Store Shape (Frontend)
```js
state = {
  auth: {
    authenticated: boolean,
    // login form state
  },
  user: {
    profile: {
      firstName,
      lastName,
      jobTitle,
      roles: [],
      userName,
      reports: [],
      homepageLayout: {}
    }
  },
  recent: {
    items: [{ path, label, timestamp }]
  }
}
```

### API Catalog (Backend)
#### Session/Auth
- `POST /api/session`
  - Request: `{ email, idToken }`
  - Response: 200 OK
- `POST /api/dev/session` (dev bypass)
  - Headers: `X-Dev-Bypass-Token`
  - Request: `{ email }`
  - Response: 200 OK

#### Preferences
- `POST /api/user-preferences`
  - Request: `{ userName, firstName, lastName, jobTitle, roles, isActive, reports, homepageLayout }`
  - Response: `{ ...same, isNewUser? }`

#### Admin Users
- `GET /api/admin/users`
  - Response: `[ { email, roles, firstName, lastName, jobTitle, isActive } ]`
- `PUT /api/admin/users`
  - Request: `{ email, password?, roles, firstName, lastName, jobTitle, isActive }`
  - Response: updated user
- `DELETE /api/admin/users?email=...`
  - Response: 200 OK

### Backend Models (SQLAlchemy/Pydantic)
#### UserPreference
- `userName`: string (unique)
- `firstName`, `lastName`, `jobTitle`: string
- `roles`: JSON array
- `isActive`: boolean
- `reports`: JSON array
- `homepageLayout`: JSON

### Full Table Schema (SQL)
```sql
CREATE TABLE userpreference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userName TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL DEFAULT '',
  lastName TEXT NOT NULL DEFAULT '',
  jobTitle TEXT NOT NULL DEFAULT '',
  roles JSONB NOT NULL DEFAULT '[]',
  isActive BOOLEAN NOT NULL DEFAULT true,
  reports JSONB NOT NULL DEFAULT '[]',
  homepageLayout JSONB NOT NULL DEFAULT '{}',
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now()
);
```

### Backend Seed Plan
- On boot, ensure a default user exists with:
  - `isActive = true`
  - `roles` from `HOG_SEED_USER_ROLES`
  - `userName` from `HOG_SEED_USER_EMAIL`

### Required Env Vars (Backend)
```bash
HOG_SEED_USER_EMAIL=
HOG_SEED_USER_JOB_TITLE=
HOG_SEED_USER_ROLES=
```

### DB Migration Plan
1. Add `reports`, `homepageLayout`, `isActive` to `userpreference`.
2. Migrate existing report preferences into `userpreference.reports`.
3. Drop `reportpreference` table.

### CSS / UX Rules (Must-Haves)
- Mobile headers: Return left, title centered.
- Mobile manage pages: Delete inside scroll; Back/Save sticky footer.
- Enhancements pills: red X (off), green ✓ (on).
- Status pill full-width and color-coded.

### Component Responsibilities
- `DashboardLayout`: orchestrates modal vs inline forms, fetches list data, handles routing for mobile forms.
- `Homepage`: manages widget layout state and persists to preferences.
- `ReportsHub`: list ordering + favorites; navigates to create/manage.
- `UsersHub`: active/inactive lists; routes to manage.

### Example: API Response (user-preferences)
```json
{
  "userName": "sarahhowell@hogonc.com",
  "firstName": "Sarah",
  "lastName": "Howell",
  "jobTitle": "Administrator",
  "roles": ["ViewReports", "EditReports"],
  "isActive": true,
  "reports": [
    {
      "reportName": "Quarterly Sales",
      "reportURL": "https://app.powerbi.com/reportEmbed?...",
      "reportId": "<guid>",
      "groupId": "<guid>",
      "orderID": 0,
      "favorite": true,
      "actionBarEnabled": true,
      "reportCopilotInEmbed": false
    }
  ],
  "homepageLayout": {
    "desktop": {"summaryCards": [], "overview": []},
    "mobile": {"summaryCards": [], "overview": []}
  }
}
```

## 2026-02-09 - Full Screen Report Modal
- Added full-screen report viewer modal for desktop + mobile with close X.
- Full screen button in report header; inline embed hidden while modal is open.
- Modal uses full-viewport layout with responsive padding (handles landscape mobile).
- Files: `ui/src/components/Pages/CustomerReport.jsx`, `ui/src/global.css`.

## 2026-02-09 - Full Screen Report Modal (Update)
- Added ESC key handling to close the full-screen report modal.

## 2026-02-09 - Admin Override: Create Report Without Verified Embed URL
- Create Report form now includes an Admin Override toggle (requires `CreateUser` role).
- When enabled, the app will create/save a report even if `/api/reports/embed-url` fails by generating a best-effort embed URL from `reportId` + `groupId`.
- Files: `ui/src/components/Homepage/DashboardLayout.jsx`, `ui/src/global.css`.

## 2026-02-09 - Multi View Reports (2-4 Reports at Once)
### Goal
Allow users to save and open a synthetic "report" that renders multiple existing Power BI reports in a single viewer.

### UX
- Create multi view from **Manage Reports** via button: `Add A multi view`.
- Builder page route: `/hog/reports/multi/create`.
- User selects **2 to 4** existing reports.
- Order matters.
  - 2: side-by-side.
  - 3: two on top + third full-width on bottom.
  - 4: 2x2 quadrants.
- Multi view is saved into `userPreferences.reports` and appears in report selection lists.
- Selecting a multi view navigates to `/hog/reports/:reportId` where `reportId` is derived from `multiViewId` (`mv-<id>`).
- Full screen modal works for multi views too.

### Data Shape (Stored In `userpreference.reports`)
A multi view is stored as a report-like object with `type: "multiView"`.
```json
{
  "type": "multiView",
  "multiViewId": "<uuid>",
  "multiViewRouteIds": ["<routeId1>", "<routeId2>", "<routeId3>", "<routeId4>"],
  "reportName": "Sales + Margin",
  "favorite": false,
  "orderID": 7,
  "reportURL": "",
  "reportId": "",
  "groupId": "",
  "enableActionBar": false,
  "enableCopilot": false
}
```
Rules:
- `multiViewRouteIds` length must be 2-4.
- References point to the `routeId` of existing reports.
- `type` defaults to `"report"` when absent.

### Frontend Implementation Notes
- Route id generation:
  - Normal reports: `routeId` derived from `reportId` in URL.
  - Multi views: `routeId` is `mv-<multiViewId>`.
- Rendering:
  - `CustomerReport` detects `activeReport.type === "multiView"`.
  - Resolves each referenced report to a report entry and embeds each in a CSS grid.
- Builder page:
  - `ReportsMultiViewBuilder.jsx` creates a new multi view object and persists it via `PUT /api/user-preferences`.

### Backend Implementation Notes
- Pydantic payload `ReportPreferencePayload` includes:
  - `type: str = "report"`
  - `multiViewId: str = ""`
  - `multiViewRouteIds: list[str] = []`
- `normalize_reports` preserves these fields.

### Files
- Frontend:
  - `ui/src/components/Pages/ReportsMultiViewBuilder.jsx`
  - `ui/src/components/Pages/CustomerReport.jsx`
  - `ui/src/components/Homepage/DashboardLayout.jsx`
  - `ui/src/services/reportUtils.js`
  - `ui/src/main.jsx`
  - `ui/src/global.css`
- Backend:
  - `connecters/api/routers/preferences.py`
  - `connecters/api/services/preferences_service.py`

## 2026-02-09 - Desktop Favorites (Reports)
- Manage Reports dialog now includes a Favorite toggle (star) for the selected report.
- Sidebar IT Reports dropdown shows a star icon next to each report indicating favorite (filled for favorite, outline for non-favorite).
- Persistence uses existing `reports[].favorite` via `PUT /api/user-preferences`.
- Files: `ui/src/components/Homepage/DashboardLayout.jsx`, `ui/src/components/Homepage/Homepage.css`, `ui/src/global.css`.

## 2026-02-09 - Prevent Duplicate Report Names (Create)
- Added backend endpoint `POST /api/reports/name-exists`.
  - Request: `{ userName, reportName }`
  - Response: `{ exists: boolean }`
  - Checks current user's `userpreference.reports[].reportName` case-insensitively.
- Create Report flow now calls this endpoint before attempting embed URL fetch and blocks creation if `exists=true`.
- Files: `connecters/api/routers/reports.py`, `ui/src/components/Homepage/DashboardLayout.jsx`.

## 2026-02-09 - Favorites Star Color (Dropdown)
- IT Reports dropdown star indicator now uses the app accent green (`var(--nav-accent)`) instead of yellow.
- File: `ui/src/components/Homepage/Homepage.css`.

## 2026-02-09 - Duplicate Report Name UX
- When the duplicate name check returns `exists=true`, the Create Report `Report Name` input now:
  - Highlights red.
  - Shows inline error text under the input: `Report Name Already Exists`.
- Files: `ui/src/components/Homepage/DashboardLayout.jsx`, `ui/src/global.css`.

## 2026-02-09 - Create Report Buttons Sizing
- Increased Create Report footer button size (Cancel/Create) for better click/tap affordance.
- Files: `ui/src/components/Homepage/DashboardLayout.jsx`, `ui/src/global.css`.

## 2026-02-09 - Create Report Duplicate Name Error Display
- Removed the bottom-of-form error message on Create Report.
- Duplicate name errors are now shown only inline under the Report Name input.
- File: `ui/src/components/Homepage/DashboardLayout.jsx`.

## 2026-02-23 - CreateUser User Report Management (Add/Delete Per User)
### Goal
Allow admins with the `CreateUser` role to manage report assignments for any selected user from Manage Users.

### Access Control
- Feature is available only through session-authenticated endpoints that require `CreateUser` role.
- Backend is source of truth for enforcement (UI visibility is not relied upon for security).

### Backend API
Implemented in `connecters/api/routers/users.py`.

1. `GET /api/admin/users/{email}/reports`
- Returns report list for target user.
- Response shape:
```json
{
  "email": "user@company.com",
  "reports": [
    {
      "reportName": "...",
      "reportURL": "...",
      "orderID": 1,
      "reportId": "",
      "groupId": "",
      "enableActionBar": false,
      "enableCopilot": false,
      "favorite": false,
      "type": "report",
      "multiViewId": "",
      "multiViewRouteIds": []
    }
  ]
}
```

2. `POST /api/admin/users/{email}/reports`
- Adds a report to target user.
- Request shape:
```json
{
  "report": {
    "reportName": "My Report",
    "reportURL": "https://app.powerbi.com/reportEmbed?...",
    "orderID": 0,
    "reportId": "",
    "groupId": "",
    "enableActionBar": false,
    "enableCopilot": false,
    "favorite": false,
    "type": "report",
    "multiViewId": "",
    "multiViewRouteIds": []
  }
}
```
- Uniqueness rule: `reportName` must be unique per user (case-insensitive).
- Duplicate returns `409` with `Report name already exists`.
- Success returns updated `reports` array.

3. `DELETE /api/admin/users/{email}/reports?reportName={name}`
- Deletes by `reportName` (case-insensitive).
- Returns updated `reports` array.
- Returns `404` if report not found.

### Backend Helper Rules
- Added helper to centralize `CreateUser` enforcement in users router.
- Added helper to resolve target user by normalized email (`404` if missing).
- Report lists are normalized and order re-numbered (`orderID = index + 1`) after add/delete.

### UI/UX
Implemented in `ui/src/components/Homepage/DashboardLayout.jsx`.

Manage Users now includes a `User Reports` section for the selected user:
- Loads selected user reports from `GET /api/admin/users/{email}/reports`.
- Allows adding report (name + embed URL) via `POST` endpoint.
- Allows deleting existing report rows via `DELETE` endpoint.
- Shows loading/empty/error states and success/error toasts.

### Mobile + Desktop
- Uses the existing Manage Users experience for both modal (desktop) and inline/full-page (mobile).
- Added responsive styles in:
  - `ui/src/components/Homepage/Homepage.css`
  - `ui/src/components/Homepage/Homepage.mobile.css`
- Mobile stacks the add-report inputs/button vertically for tap usability.

### Notes For Future Development
- If report author tracking is needed later, add metadata such as `createdBy`, `createdAt` to each report object.
- If report identity should move beyond name uniqueness, extend to (`reportId`, `groupId`) while preserving backward compatibility.
