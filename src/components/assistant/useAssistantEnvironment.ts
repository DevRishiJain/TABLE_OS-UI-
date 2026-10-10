"use client";

import { useEffect, useRef, useState } from "react";
import { useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";

const DOCK_SELECTORS = [
  ".customer-app .dk",
  ".customer-app .cb",
  ".admin-screen .bn",
  ".floor-screen .nav",
];

const OVERLAY_SELECTORS = [
  ".ov",
  ".mobile-menu-overlay",
  '[role="dialog"]',
  ".fixed.inset-0.z-50",
  ".fixed.inset-0",
];

const TOP_NAV_SELECTOR = ".tos-nav, header";

const OBSERVED_ATTR_SCOPES = [
  ".customer-app",
  ".admin-screen",
  ".floor-screen",
  ...DOCK_SELECTORS,
  ...OVERLAY_SELECTORS,
];

export interface AssistantEnvironment {
  vars: Record<string, string>;
  bottomPx: number;
  topReservePx: number;
  blocked: boolean;
  scope: "customer" | "admin" | "floor" | "global";
}

const FALLBACK_VARS_LIGHT: Record<string, string> = {
  "--tabi-panel": "#FBF6EA",
  "--tabi-surface": "#FFFFFF",
  "--tabi-ink": "#1B1409",
  "--tabi-mute": "#6F6350",
  "--tabi-line": "rgba(27,20,9,0.12)",
};

const FALLBACK_VARS_DARK: Record<string, string> = {
  "--tabi-panel": "#16120E",
  "--tabi-surface": "#1E1913",
  "--tabi-ink": "#F7EFE1",
  "--tabi-mute": "#998C7B",
  "--tabi-line": "rgba(247,239,225,0.14)",
};

function readVar(el: Element | null, name: string): string {
  if (!el) return "";
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || "";
}

function isVisibleOverlay(el: Element): boolean {
  if (el.closest("[data-tabi-root]")) return false;
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") {
    return false;
  }
  if (Number(cs.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) {
    return false;
  }
  return true;
}

function computeEnv(
  anchorLeft: number,
  anchorWidth: number,
  visibleH: number,
  vvOffsetTop: number
): {
  vars: Record<string, string>;
  bottomPx: number;
  topReservePx: number;
  blocked: boolean;
  scope: AssistantEnvironment["scope"];
} {
  const doc = document;

  const customerRoot = doc.querySelector(".customer-app");
  const adminRoot = doc.querySelector(".admin-screen");
  const floorRoot = doc.querySelector(".floor-screen");

  let vars: Record<string, string> = {};
  let scope: AssistantEnvironment["scope"] = "global";
  if (customerRoot) {
    scope = "customer";
    vars = {
      "--tabi-panel": readVar(customerRoot, "--bg"),
      "--tabi-surface": readVar(customerRoot, "--pp"),
      "--tabi-ink": readVar(customerRoot, "--ink"),
      "--tabi-mute": readVar(customerRoot, "--mu"),
      "--tabi-line": readVar(customerRoot, "--ln"),
      "--tabi-accent": readVar(customerRoot, "--ac"),
    };
  } else if (adminRoot) {
    scope = "admin";
    vars = {
      "--tabi-panel": readVar(adminRoot, "--admin-panel") || readVar(adminRoot, "--admin-pa"),
      "--tabi-surface": readVar(adminRoot, "--admin-s2") || readVar(adminRoot, "--admin-panel"),
      "--tabi-ink": readVar(adminRoot, "--admin-ink") || readVar(adminRoot, "--admin-fg"),
      "--tabi-mute": readVar(adminRoot, "--admin-mute"),
      "--tabi-line": readVar(adminRoot, "--admin-ln") || readVar(adminRoot, "--admin-bd"),
    };
  } else if (floorRoot) {
    scope = "floor";
    vars = {
      "--tabi-panel": readVar(floorRoot, "--s1") || readVar(floorRoot, "--bg"),
      "--tabi-surface": readVar(floorRoot, "--bg"),
      "--tabi-ink": readVar(floorRoot, "--ink"),
      "--tabi-mute": readVar(floorRoot, "--mute"),
      "--tabi-line": readVar(floorRoot, "--line"),
    };
  } else {
    const root = doc.documentElement;
    vars = {
      "--tabi-panel": readVar(root, "--panel") || readVar(root, "--bg"),
      "--tabi-surface": readVar(root, "--bg"),
      "--tabi-ink": readVar(root, "--ink"),
      "--tabi-mute": readVar(root, "--mute"),
      "--tabi-line": readVar(root, "--line"),
    };
  }

  const blocked = OVERLAY_SELECTORS.some((sel) =>
    Array.from(doc.querySelectorAll(sel)).some(isVisibleOverlay)
  );

  let topReservePx = 12;
  for (const el of Array.from(doc.querySelectorAll(TOP_NAV_SELECTOR))) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    if (cs.display === "none" || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) continue;
    if (rect.top <= 8 && rect.bottom > 0 && rect.bottom < visibleH / 2) {
      topReservePx = Math.max(topReservePx, Math.round(rect.bottom - vvOffsetTop + 12));
    }
  }

  let bottomPx = 20;
  for (const sel of DOCK_SELECTORS) {
    for (const el of Array.from(doc.querySelectorAll(sel))) {
      if (getComputedStyle(el).position !== "fixed") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.top < window.innerHeight / 2) continue;
      if (rect.bottom > window.innerHeight + 40) continue;
      const overlapX = anchorLeft < rect.right && anchorLeft + anchorWidth > rect.left;
      if (overlapX) {
        bottomPx = Math.max(bottomPx, Math.round(window.innerHeight - rect.top + 12));
      }
    }
  }

  const margin = 6;
  const panelOpen = !!doc.querySelector('[data-tabi-root] [role="dialog"]');
  for (let attempts = 0; attempts < 3 && !panelOpen; attempts++) {
    const y = window.innerHeight - bottomPx - anchorWidth / 2;
    const points: [number, number][] = [
      [anchorLeft + anchorWidth / 2, y],
      [anchorLeft + margin, window.innerHeight - bottomPx - margin],
      [anchorLeft + anchorWidth - margin, window.innerHeight - bottomPx - margin],
      [anchorLeft + margin, window.innerHeight - bottomPx - anchorWidth + margin],
      [anchorLeft + anchorWidth - margin, window.innerHeight - bottomPx - anchorWidth + margin],
    ];
    let raiseTo = bottomPx;
    let found = false;
    for (const [px, py] of points) {
      if (py < 0 || py > window.innerHeight || px < 0 || px > window.innerWidth) continue;
      const stack = doc.elementsFromPoint(px, py) as Element[];
      const hit = stack.find((el) => !el.closest("[data-tabi-root]"));
      if (!hit) continue;
      const interactive = hit.closest("button, a, [role=button], input, select, textarea");
      if (!interactive) continue;
      const r = interactive.getBoundingClientRect();
      const candidate = Math.round(window.innerHeight - r.top + 12);
      if (candidate > raiseTo && candidate < window.innerHeight) {
        raiseTo = candidate;
        found = true;
      }
    }
    if (!found) break;
    if (raiseTo === bottomPx) break;
    bottomPx = raiseTo;
  }

  return { vars, bottomPx, topReservePx, blocked, scope };
}

export function useAssistantEnvironment(
  pathname: string,
  side: "right" | "left",
  launcherWidth: number
): AssistantEnvironment {
  const { colorMode, themePrimaryColor, themeHoverColor } = useRestaurantTheme();
  const [env, setEnv] = useState<AssistantEnvironment>({
    vars: {},
    bottomPx: 20,
    topReservePx: 12,
    blocked: false,
    scope: "global",
  });
  const raf = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isNarrow = () => window.innerWidth <= 640;
    const sideGap = () => (isNarrow() ? 12 : 20);
    const anchorLeft = () =>
      side === "right"
        ? window.innerWidth - sideGap() - launcherWidth
        : sideGap();

    const recompute = () => {
      raf.current = 0;
      const vv = window.visualViewport;
      const next = computeEnv(
        anchorLeft(),
        launcherWidth,
        vv ? vv.height : window.innerHeight,
        vv ? vv.offsetTop : 0
      );
      setEnv((prev) => {
        if (
          prev.bottomPx === next.bottomPx &&
          prev.blocked === next.blocked &&
          prev.scope === next.scope &&
          prev.topReservePx === next.topReservePx &&
          JSON.stringify(prev.vars) === JSON.stringify(next.vars)
        ) {
          return prev;
        }
        return next;
      });
    };
    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(recompute);
    };

    recompute();

    const mo = new MutationObserver((muts) => {
      const relevant = muts.some((m) => {
        const el =
          m.target instanceof Element ? m.target : (m.target as Node).parentElement;
        if (!el) return true;
        if (el.closest("[data-tabi-root]")) return false;
        if (m.type === "attributes" && (m.attributeName === "style" || m.attributeName === "hidden")) {
          return el === document.documentElement || OBSERVED_ATTR_SCOPES.some(
            (sel) => el.matches(sel) || el.closest(sel)
          );
        }
        return true;
      });
      if (relevant) schedule();
    });
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-skin", "data-color-mode", "data-theme", "style", "hidden"],
    });

    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    for (const sel of DOCK_SELECTORS) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        ro.observe(el);
      }
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);

    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [pathname, side, launcherWidth, colorMode, themePrimaryColor]);

  const basePalette = colorMode === "dark" ? FALLBACK_VARS_DARK : FALLBACK_VARS_LIGHT;
  const isCustomer = env.scope === "customer";

  const primary = isCustomer
    ? env.vars["--tabi-accent"] || themePrimaryColor || "#E9B24C"
    : themePrimaryColor || "#E9B24C";
  const secondary = isCustomer
    ? `color-mix(in srgb, ${primary} 70%, #000)`
    : themeHoverColor || "#D4562C";

  const vars: Record<string, string> = {
    ...basePalette,
    ...Object.fromEntries(Object.entries(env.vars).filter(([, v]) => Boolean(v))),
    "--tabi-accent": primary,
    "--tabi-accent2": secondary,
    "--tabi-accentDeep": `color-mix(in srgb, ${primary} 62%, #3d2b05)`,
    "--tabi-accentInk": colorMode === "dark" ? "#F7EFE1" : "#1B1409",
    "--tabi-bottom": `${env.bottomPx}px`,
    "--tabi-top-reserve": `${env.topReservePx}px`,
  };

  return { vars, bottomPx: env.bottomPx, topReservePx: env.topReservePx, blocked: env.blocked, scope: env.scope };
}
