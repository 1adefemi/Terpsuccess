import Nav from "@/components/Nav";
import Link from "next/link";

export default function TermsPage() {
  const updated = "March 2026";
  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <Nav />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>Terms of Service</h1>
        <p style={{ color: "#9A9A9A", fontSize: 14, marginBottom: 40 }}>Last updated: {updated}</p>

        {[
          {
            title: "1. About TerpSuccess",
            body: "TerpSuccess is a platform for UMD students. It is not affiliated with, endorsed by, or operated by the University of Maryland. By using TerpSuccess, you agree to these terms."
          },
          {
            title: "2. User-Submitted Content",
            body: "Students may submit course reports, professor reviews, and study resources. By submitting content, you confirm that it is truthful and based on your genuine experience. You agree not to submit false, misleading, defamatory, or harassing content. TerpSuccess reserves the right to remove any content that violates these terms."
          },
          {
            title: "3. Accuracy of Information",
            body: "TerpSuccess aggregates data from multiple sources including student submissions, the umd.io public API, and the PlanetTerp public API. While we do our best to ensure accuracy, we make no guarantees about the completeness or correctness of any data. Do not rely solely on TerpSuccess for academic decisions."
          },
          {
            title: "4. Data Sources",
            body: "Course and professor data is sourced from the umd.io public API, which scrapes Testudo, the official UMD course catalog. Grade distribution data is sourced from the PlanetTerp public API. Student-submitted data is moderated before publication."
          },
          {
            title: "5. Privacy",
            body: "Course reports and reviews are submitted anonymously. TerpSuccess does not collect personally identifiable information from anonymous submissions. If you create an account, your email is stored securely and never sold or shared with third parties."
          },
          {
            title: "6. Intellectual Property",
            body: "TerpSuccess does not reproduce copyrighted materials such as syllabi, exam papers, or textbook content. If you believe any content on TerpSuccess infringes your copyright, please contact us and we will remove it promptly."
          },
          {
            title: "7. No Warranty",
            body: "TerpSuccess is provided as-is without any warranty. We are not liable for any academic, financial, or other decisions made based on information found on this site."
          },
          {
            title: "8. Changes to Terms",
            body: "We may update these terms at any time. Continued use of TerpSuccess after changes constitutes acceptance of the new terms."
          },
          {
            title: "9. Contact",
            body: "If you have questions, concerns, or need to report content, please reach out to us through the site."
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#1A1A1A" }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: "#5A5A5A", lineHeight: 1.7 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 24, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: "#9A9A9A", lineHeight: 1.6 }}>
            TerpSuccess is not affiliated with or endorsed by the University of Maryland.
            Grade data sourced from <a href="https://planetterp.com" target="_blank" rel="noreferrer" style={{ color: "#B89A00" }}>PlanetTerp</a>.
            Course data sourced from <a href="https://umd.io" target="_blank" rel="noreferrer" style={{ color: "#B89A00" }}>umd.io</a>.
          </p>
        </div>

        <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#B89A00", fontWeight: 600, fontSize: 14 }}>← Back to TerpSuccess</Link>
      </div>
    </main>
  );
}
