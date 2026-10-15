"use client";
import { getInstanceTimeZone } from "@mairie360/front-kit/shared";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
const snapshot = () => {
  const label = new Intl.DateTimeFormat("fr-FR", { timeZone: getInstanceTimeZone(), weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return label.charAt(0).toLocaleUpperCase("fr") + label.slice(1);
};
export default function CurrentDate() {
  const label = useSyncExternalStore(subscribe, snapshot, () => "");
  return <span className="page-current-date">{label}</span>;
}
