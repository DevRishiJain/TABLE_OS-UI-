"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MascotMood } from "./TabiMascot";

export const TOUR_SUGGESTION = "Show me around";
export const TOUR_PAUSE_TEXT = "I'll wait — take a look around.";
export const TOUR_DONE_TEXT =
  "That's the tour! I'll be in the corner whenever you need me.";

interface TourStepDef {
  sel: string;
  text: string;
  mood: MascotMood;
}

export const TOUR_STEPS: TourStepDef[] = [
  {
    sel: ".hero-cta",
    text: "Restaurants start free for 2 months — this button begins onboarding.",
    mood: "excited",
  },
  {
    sel: "#orders",
    text: "Live orders stream in from every QR table. No app install for guests.",
    mood: "searching",
  },
  {
    sel: "#kds",
    text: "The kitchen display queues tickets and flags late ones automatically.",
    mood: "working",
  },
  {
    sel: "#waiter",
    text: "Guests call a waiter from their table — requests route to the assigned waiter.",
    mood: "curious",
  },
  {
    sel: "#waste",
    text: "Wastage logging shows exactly what you're throwing away, in rupees.",
    mood: "proud",
  },
  {
    sel: "#venues",
    text: "Works for restaurants, bars, hotels and cloud kitchens.",
    mood: "happy",
  },
  {
    sel: "#themes",
    text: "Pick your brand colors — I change my look too!",
    mood: "playful",
  },
  {
    sel: "#contact",
    text: "Ready? Book a demo or start onboarding right here.",
    mood: "celebrate",
  },
];

const SCROLL_SETTLE_MS = 900;
const MOVE_MS = 1800;
const CAPTION_MS = 4500;
const RESUME_MS = 8000;
const DONE_MS = 3000;
const EDGE = 16;
const GAP = 24;
const BUBBLE_H = 140;
const INTERACTIVE = "button,a,input,select,textarea,[role=button]";

type Offset = { x: number; y: number };
type NavDir = "next" | "back";
type WaitVerdict = "timer" | "intr" | NavDir;
type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

const clampN = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function mostlyVisible(r: Rect, vw: number, vh: number): boolean {
  if (r.width <= 0 || r.height <= 0) return false;
  if (r.height > vh) return r.top < vh * 0.45 && r.bottom > vh * 0.55;
  const visW = Math.min(r.right, vw) - Math.max(r.left, 0);
  const visH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  return visW > 0 && visH > 0 && (visW * visH) / (r.width * r.height) >= 0.55;
}

function spotClear(x: number, y: number, w: number, h: number): boolean {
  const pts: [number, number][] = [
    [x + w / 2, y + h / 2],
    [x + 6, y + 6],
    [x + w - 6, y + 6],
    [x + 6, y + h - 6],
    [x + w - 6, y + h - 6],
  ];
  return pts.every(([px, py]) => {
    const hit = (document.elementsFromPoint(px, py) as Element[]).find(
      (el) => !el.closest("[data-tabi-root]")
    );
    if (!hit) return true;
    return !hit.closest(INTERACTIVE);
  });
}

function pickSpot(
  r: Rect,
  w: number,
  h: number,
  vw: number,
  vh: number,
  topPad: number,
  stepIdx: number,
  cur: Offset,
  cursor: Offset
): Offset | null {
  const visTop = clampN(r.top, topPad, vh - EDGE);
  const visBot = clampN(r.bottom, topPad, vh - EDGE);
  const cy = (visTop + visBot) / 2 - h / 2 + ((stepIdx % 3) - 1) * 46;
  const rightSide = { x: r.right + GAP, y: cy };
  const leftSide = { x: r.left - GAP - w, y: cy };
  const preferLeftFirst = r.left > vw - r.right;
  const cands: Offset[] =
    (preferLeftFirst ? stepIdx % 2 === 0 : stepIdx % 2 !== 0)
      ? [leftSide, rightSide]
      : [rightSide, leftSide];
  cands.push({ x: r.left + r.width / 2 - w / 2, y: r.bottom + GAP });
  cands.push({ x: r.left + r.width / 2 - w / 2, y: r.top - GAP - h });
  let fallback: Offset | null = null;
  for (const c of cands) {
    const x = clampN(c.x, EDGE, vw - w - EDGE);
    const y = clampN(c.y, topPad, vh - h - EDGE);
    if (!spotClear(x, y, w, h)) continue;
    if (!fallback) fallback = { x, y };
    if (
      cursor.x >= 0 &&
      cursor.x > x - 24 &&
      cursor.x < x + w + 24 &&
      cursor.y > y - 24 &&
      cursor.y < y + h + 24
    ) {
      continue;
    }
    if (Math.hypot(x - cur.x, y - cur.y) > 48) return { x, y };
  }
  return fallback;
}

export interface TabiTourView {
  caption: string | null;
  liveText: string;
  counter: string | null;
  step: number;
  flip: "left" | "right";
  below: boolean;
  hopTick: number;
  stationary: boolean;
  skip: () => void;
  next: () => void;
  back: () => void;
}

interface UseTabiTourArgs {
  on: boolean;
  reducedMotion: boolean;
  hoverPause: boolean;
  abort: boolean;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
  topReservePx: number;
  setMood: (m: MascotMood) => void;
  setRoamOffset: (o: Offset | null) => void;
  setTraveling?: (t: boolean) => void;
  setFaceDir?: (d: -1 | 1) => void;
  onEnd: (completed: boolean) => void;
}

export function useTabiTour(args: UseTabiTourArgs): TabiTourView {
  const { on, hoverPause, abort } = args;

  const [caption, setCaption] = useState<string | null>(null);
  const [liveText, setLiveText] = useState("");
  const [counter, setCounter] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [flip, setFlip] = useState<"left" | "right">("right");
  const [below, setBelow] = useState(false);
  const [hopTick, setHopTick] = useState(0);
  const [stationary, setStationary] = useState(false);

  const argsRef = useRef(args);
  argsRef.current = args;

  const seq = useRef(0);
  const waitRef = useRef<{
    t: ReturnType<typeof setTimeout>;
    res: (v: WaitVerdict) => void;
  } | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gateRes = useRef<(() => void) | null>(null);
  const reasons = useRef<Set<string>>(new Set());
  const needsRestart = useRef(false);
  const lastOffset = useRef<Offset | null>(null);
  const dockPos = useRef<Offset | null>(null);
  const navPending = useRef<NavDir | null>(null);
  const ctl = useRef<{
    enter: (r: string) => void;
    exit: (r: string) => void;
    nav: (d: NavDir) => void;
    finish: (done: boolean) => void;
  } | null>(null);

  const skip = useCallback(() => {
    ctl.current?.finish(false);
  }, []);
  const next = useCallback(() => {
    ctl.current?.nav("next");
  }, []);
  const back = useCallback(() => {
    ctl.current?.nav("back");
  }, []);

  useEffect(() => {
    if (!on) return;
    const mySeq = ++seq.current;
    const alive = () => seq.current === mySeq;
    reasons.current = new Set();
    needsRestart.current = false;
    lastOffset.current = null;
    dockPos.current = null;
    navPending.current = null;

    const reduced = argsRef.current.reducedMotion;
    const mobile =
      window.innerWidth < 900 ||
      !window.matchMedia("(pointer: fine)").matches;
    const moving = !reduced && !mobile;
    setStationary(!moving);

    const isPaused = () => reasons.current.size > 0;
    const interrupt = () => {
      const w = waitRef.current;
      if (w) {
        clearTimeout(w.t);
        waitRef.current = null;
        w.res("intr");
      }
    };
    const wait = (ms: number) =>
      new Promise<WaitVerdict>((res) => {
        const t = setTimeout(() => {
          waitRef.current = null;
          res("timer");
        }, ms);
        waitRef.current = { t, res };
      });
    const releaseGate = () => {
      if (reasons.current.size === 0 && gateRes.current) {
        const g = gateRes.current;
        gateRes.current = null;
        g();
      }
    };
    const gate = () =>
      new Promise<void>((res) => {
        if (!isPaused()) res();
        else gateRes.current = res;
      });
    const exit = (reason: string) => {
      reasons.current.delete(reason);
      if (reason === "user" && resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      releaseGate();
    };
    const enter = (reason: string) => {
      if (!alive()) return;
      if (reason === "user") {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => exit("user"), RESUME_MS);
      }
      if (!reasons.current.has(reason)) {
        reasons.current.add(reason);
        needsRestart.current = true;
        interrupt();
        setCaption(TOUR_PAUSE_TEXT);
        setLiveText(TOUR_PAUSE_TEXT);
        argsRef.current.setMood("idle");
      }
    };
    const nav = (dir: NavDir) => {
      if (!alive()) return;
      exit("user");
      needsRestart.current = false;
      const w = waitRef.current;
      if (w) {
        clearTimeout(w.t);
        waitRef.current = null;
        w.res(dir);
      } else {
        navPending.current = dir;
      }
    };
    const finish = (done: boolean) => {
      if (!alive()) return;
      seq.current++;
      if (waitRef.current) {
        clearTimeout(waitRef.current.t);
        waitRef.current = null;
      }
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      gateRes.current = null;
      reasons.current.clear();
      lastOffset.current = null;
      dockPos.current = null;
      navPending.current = null;
      argsRef.current.setTraveling?.(false);
      argsRef.current.setRoamOffset(null);
      setCaption(null);
      setCounter(null);
      setStep(0);
      setLiveText("");
      argsRef.current.onEnd(done);
    };
    ctl.current = { enter, exit, nav, finish };

    if (document.hidden) reasons.current.add("hidden");
    if (argsRef.current.hoverPause) reasons.current.add("hover");

    const cursor = { x: -1, y: -1 };
    const onPtrMove = (e: PointerEvent) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };
    const onUserActivity = () => enter("user");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nav("next");
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nav("back");
        return;
      }
      enter("user");
    };
    const onVis = () => {
      if (document.hidden) enter("hidden");
      else exit("hidden");
    };
    window.addEventListener("wheel", onUserActivity, { passive: true });
    window.addEventListener("touchmove", onUserActivity, { passive: true });
    window.addEventListener("pointermove", onPtrMove, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);

    const run = async () => {
      const steps = TOUR_STEPS.map((s) => ({
        ...s,
        el: document.querySelector<HTMLElement>(s.sel),
      })).filter(
        (s): s is TourStepDef & { el: HTMLElement } => s.el !== null
      );
      if (steps.length === 0) {
        finish(false);
        return;
      }
      const total = steps.length;

      let i = 0;
      while (i < steps.length) {
        if (!alive()) return;
        await gate();
        if (!alive()) return;
        if (navPending.current) {
          const d = navPending.current;
          navPending.current = null;
          i = clampN(i + (d === "next" ? 1 : -1), 0, steps.length - 1);
        } else if (needsRestart.current) {
          needsRestart.current = false;
          await gate();
          if (!alive()) return;
        }

        const st = steps[i];
        const el = st.el;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const topPad = (argsRef.current.topReservePx || 12) + EDGE;

        if (!reduced) {
          const r = el.getBoundingClientRect();
          if (!mostlyVisible(r, vw, vh)) {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
            const v = await wait(SCROLL_SETTLE_MS);
            if (!alive()) return;
            if (v === "next") { i++; continue; }
            if (v === "back") { i = Math.max(0, i - 1); continue; }
            if (isPaused() || needsRestart.current) continue;
          }
        }

        if (moving) {
          const launcher = argsRef.current.launcherRef.current;
          const lr = launcher?.getBoundingClientRect();
          const r2 = el.getBoundingClientRect();
          let placed = false;
          if (lr && lr.width > 0) {
            if (!dockPos.current) {
              dockPos.current = { x: lr.left, y: lr.top };
            }
            const base = dockPos.current;
            const curPos = {
              x: base.x + (lastOffset.current?.x ?? 0),
              y: base.y + (lastOffset.current?.y ?? 0),
            };
            const spot = pickSpot(
              r2,
              lr.width,
              lr.height,
              vw,
              vh,
              topPad,
              i,
              curPos,
              cursor
            );
            if (spot) {
              const off = { x: spot.x - base.x, y: spot.y - base.y };
              argsRef.current.setFaceDir?.(spot.x >= curPos.x ? 1 : -1);
              argsRef.current.setTraveling?.(true);
              lastOffset.current = off;
              argsRef.current.setRoamOffset(off);
              setFlip(spot.x + lr.width / 2 < vw / 2 ? "left" : "right");
              setBelow(spot.y < topPad + BUBBLE_H);
              placed = true;
            }
          }
          if (!placed) {
            lastOffset.current = null;
            argsRef.current.setRoamOffset(null);
            setFlip("right");
            setBelow(false);
          }
          const v = await wait(MOVE_MS);
          argsRef.current.setTraveling?.(false);
          if (!alive()) return;
          if (v === "next") { i++; continue; }
          if (v === "back") { i = Math.max(0, i - 1); continue; }
          if (isPaused() || needsRestart.current) continue;
        } else {
          const lr = argsRef.current.launcherRef.current?.getBoundingClientRect();
          setFlip(lr && lr.left + lr.width / 2 < vw / 2 ? "left" : "right");
          setBelow(false);
          if (mobile && !reduced) setHopTick((t) => t + 1);
        }

        setStep(i + 1);
        setCounter(`${i + 1} / ${total}`);
        argsRef.current.setMood(st.mood);
        setCaption(st.text);
        setLiveText(`Step ${i + 1} of ${total}: ${st.text}`);
        const verdict = await wait(CAPTION_MS);
        if (!alive()) return;
        setCaption(null);
        if (verdict === "next") {
          i++;
          continue;
        }
        if (verdict === "back") {
          i = Math.max(0, i - 1);
          continue;
        }
        if (isPaused() || needsRestart.current) continue;
        i++;
      }

      setCounter(null);
      setStep(0);
      argsRef.current.setMood("celebrate");
      setCaption(TOUR_DONE_TEXT);
      setLiveText(TOUR_DONE_TEXT);
      await wait(DONE_MS);
      if (!alive()) return;
      finish(true);
    };
    run();

    return () => {
      seq.current++;
      if (waitRef.current) {
        clearTimeout(waitRef.current.t);
        waitRef.current = null;
      }
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      gateRes.current = null;
      reasons.current.clear();
      navPending.current = null;
      dockPos.current = null;
      ctl.current = null;
      window.removeEventListener("wheel", onUserActivity);
      window.removeEventListener("touchmove", onUserActivity);
      window.removeEventListener("pointermove", onPtrMove);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      argsRef.current.setTraveling?.(false);
      argsRef.current.setRoamOffset(null);
      setCaption(null);
      setCounter(null);
      setStep(0);
      setLiveText("");
    };
  }, [on]);

  useEffect(() => {
    if (!on) return;
    if (!hoverPause) {
      ctl.current?.exit("hover");
      return;
    }
    const t = setTimeout(() => {
      if (argsRef.current.hoverPause) ctl.current?.enter("hover");
    }, 650);
    return () => clearTimeout(t);
  }, [on, hoverPause]);

  useEffect(() => {
    if (on && abort) ctl.current?.finish(false);
  }, [on, abort]);

  return {
    caption,
    liveText,
    counter,
    step,
    flip,
    below,
    hopTick,
    stationary,
    skip,
    next,
    back,
  };
}
