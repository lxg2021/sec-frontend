"use client"

export default function RemoteForensicsPage() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="http://localhost:8888/guacamole/#/"
        title="远程取证"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  )
}
