"use client";

import { useState } from "react";
import { downloadFile } from "@/lib/files";

export function FileDownloadButton({
  fileName,
  label = "Download file",
  className = "btn-secondary",
}: {
  fileName: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      await downloadFile(fileName);
    } catch {
      setError("Could not download file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} onClick={handleClick} disabled={loading}>
        {loading ? "Downloading…" : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
