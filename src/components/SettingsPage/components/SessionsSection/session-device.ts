import { describeUserAgent } from "@mairie360/lib-components/primitives";

/**
 * MAIR-1258 (artifact « Sessions »): a session is named « Firefox 132 · Windows », read from its user-agent.
 * A device the lib does not recognise keeps the text the BFF sent, never « Système inconnu ».
 */
export function sessionDeviceLabel(session: { device_info: string }): string {
  const raw = session.device_info?.trim() ?? "";
  if (!raw) return "Appareil inconnu";
  const { browser, os } = describeUserAgent(raw);
  if (browser === raw) return raw;
  return os === "Système inconnu" ? browser : `${browser} · ${os}`;
}
