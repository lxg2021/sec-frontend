"use client";

export default function HardwareAssetsPage() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="http://localhost:8888/guacamole/#/"
        title="Guacamole"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
