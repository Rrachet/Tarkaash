import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Tarkkash: trusted local services in Hyderabad. Har Hunar Ko Ek Pehchaan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/tarkaash-logo-gold.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "linear-gradient(135deg, #003b3c 0%, #004b4b 60%, #0b5f5c 100%)", color: "#fff", fontFamily: "Georgia, serif" }}>
        <img src={logoSrc} alt="" width={330} height={161} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>Good services.</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, color: "#d9a441" }}>Closer to home.</div>
          <div style={{ marginTop: 24, fontSize: 30, color: "rgba(255,255,255,0.85)", fontFamily: "sans-serif" }}>
            Trusted home bakers, tiffins, tutors and local services in Hyderabad
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#f7e8c5", fontFamily: "sans-serif", letterSpacing: 4, textTransform: "uppercase" }}>
          Har Hunar Ko Ek Pehchaan
        </div>
      </div>
    ),
    size,
  );
}
