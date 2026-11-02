export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(data: unknown, filename: string) {
  downloadBlob(new Blob([JSON.stringify(data)], { type: "application/json" }), filename);
}

/** Keeps Thai letters; strips characters that file systems reject. */
export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 80) || "demax";
}
