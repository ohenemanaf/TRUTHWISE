import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the logo mark (AND table, lit 1·1 cell) on paper, drawn at build time. */
export default function AppleIcon() {
  const cell = (lit: boolean) => ({
    width: 52,
    height: 52,
    borderRadius: 12,
    border: lit ? "none" : "8px solid #172036",
    background: lit ? "#4644c9" : "transparent",
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5f7fa",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: 12,
          padding: 32,
        }}
      >
        <div style={cell(false)} />
        <div style={cell(false)} />
        <div style={cell(false)} />
        <div style={cell(true)} />
      </div>
    ),
    size,
  );
}
