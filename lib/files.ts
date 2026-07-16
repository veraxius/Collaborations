import { getApiBase, getToken } from "./api";

export async function downloadFile(fileName: string, displayName?: string) {
  const token = getToken();
  const res = await fetch(`${getApiBase()}/api/files/${encodeURIComponent(fileName)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = displayName || fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
