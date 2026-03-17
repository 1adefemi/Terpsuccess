"use client";
import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Nav() {
  return (
    <nav style={{ background: "#1A1A1A", borderBottom: "3px solid #FFD200", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: "#FFD200", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>TS</div>
        <span style={{ color: "white", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>Terp<span style={{ color: "#FFD200" }}>Success</span></span>
      </Link>
      <div style={{ flex: 1, maxWidth: 500 }}>
        <SearchBar dark placeholder="Search courses or professors..." />
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
        <Link href="/browse" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Browse</Link>
        <Link href="/submit" style={{ background: "#FFD200", color: "#1A1A1A", fontWeight: 600, fontSize: 13, padding: "7px 16px", borderRadius: 8 }}>Submit Report</Link>
      </div>
    </nav>
  );
}
