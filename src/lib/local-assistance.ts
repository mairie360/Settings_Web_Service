export type AssistanceKind = "support" | "report";
export type LocalFile = { name: string; content: string; type: string };

export const MAX_ASSISTANCE_MESSAGE = 5000;

export function assistanceFile(kind: AssistanceKind, message: string, date = new Date()): LocalFile {
  if (!message.trim() || message.length > MAX_ASSISTANCE_MESSAGE) {
    throw new Error("Décrivez votre demande en 1 à 5 000 caractères non vides.");
  }
  const report = kind === "report";
  return {
    name: report ? "signalement-settings.txt" : "demande-support-settings.txt",
    type: "text/plain;charset=utf-8",
    content: `${report ? "Signalement" : "Demande de support"} — Settings\n${date.toISOString()}\n\n${message}\n\nFichier préparé localement. Aucun message n’a été envoyé.\n`,
  };
}

// Export only coarse labels, never the raw user-agent or application state.
export function deviceFamilies(userAgent: string) {
  const browser = /Edg(?:e|A|iOS)?\//.test(userAgent) ? "Edge"
    : /OPR\/|Opera\//.test(userAgent) ? "Opera"
    : /Firefox\/|FxiOS\//.test(userAgent) ? "Firefox"
    : /Chrome\/|CriOS\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari" : "Non identifié";
  const operatingSystem = /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad|iPod/.test(userAgent) ? "iOS"
    : /Windows/.test(userAgent) ? "Windows"
    : /CrOS/.test(userAgent) ? "ChromeOS"
    : /Macintosh|Mac OS X/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux" : "Non identifié";
  return { browser, operatingSystem };
}

export function diagnosticFile(userAgent: string, objectUrlsAvailable: boolean, date = new Date()): LocalFile {
  return {
    name: "diagnostic-local-settings.json",
    type: "application/json;charset=utf-8",
    content: JSON.stringify({
      module: "Settings_Web_Service",
      generatedAt: date.toISOString(),
      ...deviceFamilies(userAgent),
      capabilities: { objectUrls: objectUrlsAvailable },
    }, null, 2),
  };
}

/** Request a local download; browsers may still ask the user to save the file. */
export function downloadLocalFile(file: LocalFile): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: file.type }));
  let anchor: HTMLAnchorElement | undefined;
  let requested = false;
  try {
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    requested = true;
  } finally {
    anchor?.remove();
    // Leave time for the browser to consume the Blob, including after unmount.
    if (requested) setTimeout(() => URL.revokeObjectURL(url), 1000);
    else URL.revokeObjectURL(url);
  }
}
