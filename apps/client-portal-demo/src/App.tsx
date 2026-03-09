import { PortalApp, createMockPortalAdapter } from "@howell-technologies/portal";

const adapter = createMockPortalAdapter({
  session: {
    id: "client-demo-user",
    name: "Morgan Lee",
    email: "morgan@riverbendhealth.example.com",
    role: "Operations Director",
  },
  content: {
    headline: "Riverbend Care Hub",
    subheadline: "A branded client portal rendered from the shared Howell Technologies PortalApp package.",
    statusMessage: "Core care operations are stable and ticketing is synced through Tech Connect.",
    announcements: [
      "Monthly KPI review is now available in Reports.",
      "Support runbook updates were published this morning.",
    ],
  },
});

export default function App() {
  return (
    <main style={{ padding: 32, minHeight: "100vh", background: "#edf5fa" }}>
      <PortalApp
        branding={{
          companyName: "Riverbend Health",
          tagLine: "Client-facing portal experience powered by Howell Technologies.",
          theme: {
            primary: "#0a597a",
            surface: "#f3f9fc",
            accent: "#d0e7ef",
            text: "#143041",
            mutedText: "#537083",
          },
        }}
        features={{ reports: true, tickets: true, documents: true }}
        adapter={adapter}
        basePath="/portal"
      />
    </main>
  );
}
