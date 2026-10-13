import { Bell, Globe, Info, Palette, Shield, UserRound } from "lucide-react";
const icons = { profile: UserRound, security: Shield, notifications: Bell, appearance: Palette, general: Globe, system: Info };
export default function SettingsTabIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" focusable="false" width={20} height={20} strokeWidth={1.8} />;
}
