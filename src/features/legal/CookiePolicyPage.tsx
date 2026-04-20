import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export function CookiePolicyPage() {
  return (
    <LegalPageLayout>
      <h1 className="text-3xl font-bold text-primary mb-1">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-2">PassAI — operated by Shryn, Inc.</p>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 14, 2026</p>

      <Section title="What are cookies?">
        <P>Cookies are small text files stored on your device when you visit a website. They help the site function properly and can provide information about how you use the site.</P>
      </Section>

      <Section title="Cookies PassAI uses">
        <H3>Essential cookies (always active)</H3>
        <P>These are required for PassAI to work. You cannot opt out of these while using the service.</P>
        <table className="w-full text-sm border-collapse mt-3">
          <thead>
            <tr className="bg-secondary/40">
              <Th>Cookie</Th>
              <Th>Purpose</Th>
              <Th>Duration</Th>
            </tr>
          </thead>
          <tbody>
            <tr><Td>sb-access-token</Td><Td>Supabase authentication — keeps you logged in</Td><Td>Session</Td></tr>
            <tr><Td>sb-refresh-token</Td><Td>Supabase authentication — refreshes your session</Td><Td>7 days</Td></tr>
          </tbody>
        </table>

        <H3>Analytics cookies (opt-in only)</H3>
        <P>These help us understand how users interact with PassAI so we can improve the product. They are disabled by default and only enabled if you consent.</P>
        <table className="w-full text-sm border-collapse mt-3">
          <thead>
            <tr className="bg-secondary/40">
              <Th>Cookie</Th>
              <Th>Purpose</Th>
              <Th>Provider</Th>
              <Th>Duration</Th>
            </tr>
          </thead>
          <tbody>
            <tr><Td>PostHog analytics</Td><Td>Usage patterns, feature adoption, error tracking</Td><Td>PostHog</Td><Td>1 year</Td></tr>
          </tbody>
        </table>
        <P className="mt-3">We do not use advertising or tracking cookies.</P>
      </Section>

      <Section title="Managing cookies">
        <P>You can withdraw your consent for analytics cookies at any time through the cookie settings link in the app footer. You can also clear cookies through your browser settings.</P>
      </Section>

      <Section title="Contact">
        <P>Questions about our cookie practices? Email <a href="mailto:passai.study@gmail.com" className="text-primary hover:underline">passai.study@gmail.com</a>.</P>
      </Section>
    </LegalPageLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-3 pb-2 border-b border-border/40">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-5 mb-2">{children}</h3>;
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground leading-relaxed ${className ?? ""}`}>{children}</p>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-medium text-foreground border border-border/50">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-muted-foreground border border-border/50">{children}</td>;
}
