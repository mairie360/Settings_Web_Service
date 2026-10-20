"use client";
import { useInstanceRole, useModalFocusScope } from '@mairie360/lib-components/react';

import { AppShell } from "@mairie360/lib-components/shell";
import { useEffect, useRef, useState, type CSSProperties, type ComponentProps } from "react";
import DesktopNavigation from './desktop-navigation';

// Keep trusted display-role and external dialog isolation around the shared shell.
export default function AccessibleShell({ children, footerProps, ...props }: ComponentProps<typeof AppShell>) {
  const role = useInstanceRole();
  props = { ...props, isAdmin: role === 'Admin' };
  const frame = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(76);
  const [collapsed, setCollapsed] = useState(false);
  const navigationInactive = useModalFocusScope(frame);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const footer = frame.current?.querySelector("footer.app-accessible-footer");
    if (!footer) return;
    const measure = () => setFooterHeight(Math.ceil(footer.getBoundingClientRect().height));
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div ref={frame} className="app-shell-frame" data-sidebar-collapsed={collapsed} style={{ "--app-footer-height": `${footerHeight}px` } as CSSProperties}>
    <AppShell {...props} skipLinkInactive={navigationInactive}
      desktopNavigation={<DesktopNavigation {...props} inactive={navigationInactive} onCollapsedChange={setCollapsed} />}
      sidebarProps={{ ...props.sidebarProps, className: `app-published-sidebar ${props.sidebarProps?.className ?? ''}` }} footerPlacement="content" footerProps={{ ...footerProps, className: `app-accessible-footer ${footerProps?.className ?? ""}` }}>
      <div className="app-main-content">{children}</div>
    </AppShell>
  </div>;
}
