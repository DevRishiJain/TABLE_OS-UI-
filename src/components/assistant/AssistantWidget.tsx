"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Minus,
  Pause,
  Play,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useAppSelector } from "@/store";
import {
  askAssistant,
  getAssistantContext,
  AssistantMessage,
  AssistantRequestError,
} from "@/lib/assistant";
import { TabiMascot, MascotMood } from "./TabiMascot";
import TabiSpotlight from "./TabiSpotlight";
import { useAssistantEnvironment } from "./useAssistantEnvironment";
import { useTabiTour, TOUR_SUGGESTION } from "./useTabiTour";
import styles from "./assistant.module.css";

type ChatMessage = AssistantMessage & { source?: "gemini" | "guide" };

const MAX_VISIBLE = 12;
const CLIENT_TIMEOUT_MS = 14_000;
const IDLE_DROWSY_MS = 30_000;
const IDLE_SLEEP_MS = 5_000;
const GENERIC_ERROR = "Tabi couldn't answer right now. Please try again in a moment.";
const TIMEOUT_ERROR = "Tabi timed out. Please try again.";

function storageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, val: string) {
  try {
    sessionStorage.setItem(key, val);
  } catch {}
}
function localGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function localSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

export default function AssistantWidget() {
  const pathname = usePathname();
  const ctx = useMemo(() => getAssistantContext(pathname), [pathname]);

  const staffId = useAppSelector((s) => s.auth.staffId);
  const restaurantId = useAppSelector((s) => s.auth.restaurantId);
  const activeSessionId = useAppSelector((s) => s.auth.activeSessionId);
  const guardToken = useAppSelector((s) => s.auth.guardToken);
  const latestToastId = useAppSelector((s) =>
    s.ui.toasts.length ? s.ui.toasts[s.ui.toasts.length - 1].id : null
  );
  const latestToastType = useAppSelector((s) =>
    s.ui.toasts.length ? s.ui.toasts[s.ui.toasts.length - 1].type : null
  );

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sysPaused, setSysPaused] = useState(false);
  const [side, setSide] = useState<"right" | "left">("right");
  const [mood, setMood] = useState<MascotMood>("waking");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [vp, setVp] = useState({ vh: 0, kbOffset: 0 });
  const [spotlight, setSpotlight] = useState(false);
  const [tourOn, setTourOn] = useState(false);
  const [roamOffset, setRoamOffset] = useState<{ x: number; y: number } | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleFlip, setBubbleFlip] = useState<"left" | "right">("right");
  const [traveling, setTraveling] = useState(false);
  const [faceDir, setFaceDir] = useState<-1 | 1>(1);
  const [wandering, setWandering] = useState(false);
  const [isDesktopPtr, setIsDesktopPtr] = useState(false);

  const effectivePaused = paused || sysPaused;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const moodRef = useRef<MascotMood>("waking");
  const requestRef = useRef<{
    controller: AbortController;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef(0);
  const autofocusRaf = useRef(0);
  const focusRaf = useRef(0);
  const spotlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roamSeq = useRef(0);
  const engagedRef = useRef(false);
  const prevFocus = useRef<Element | null>(null);
  const wanderHoldUntil = useRef(0);
  const progFocusUntil = useRef(0);
  const ptrPos = useRef({ x: -1, y: -1 });
  const curRoamOff = useRef<{ x: number; y: number } | null>(null);


  const identityKey = `${pathname}|${staffId}|${restaurantId}|${activeSessionId}|${guardToken ? 1 : 0}`;
  const identityRef = useRef(identityKey);
  identityRef.current = identityKey;

  const env = useAssistantEnvironment(pathname, side, isSmallScreen ? 60 : 96);
  const isHome = pathname === "/";

  const cancelRequest = useCallback(() => {
    const pending = requestRef.current;
    requestRef.current = null;
    if (pending) {
      clearTimeout(pending.timer);
      pending.controller.abort();
    }
  }, []);

  const setMoodFor = useCallback((m: MascotMood, ms?: number) => {
    setMood(m);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = null;
    if (ms) {
      moodTimer.current = setTimeout(() => setMood("idle"), ms);
    }
  }, []);

  useEffect(() => {
    moodTimer.current = setTimeout(() => setMood("idle"), 900);
    return () => {
      if (moodTimer.current) clearTimeout(moodTimer.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedSide = storageGet("tabi-side");
    if (savedSide === "left" || savedSide === "right") setSide(savedSide);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallMq = window.matchMedia("(max-width: 640px)");
    const apply = () => {
      const shouldPause = mq.matches || document.hidden;
      setSysPaused(shouldPause);
      setIsSmallScreen(smallMq.matches);
      if (mq.matches) setMood("idle");
    };
    apply();
    mq.addEventListener("change", apply);
    smallMq.addEventListener("change", apply);
    const onVis = () => apply();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", apply);
      smallMq.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const vv = window.visualViewport;
      const visibleH = vv ? vv.height : window.innerHeight;
      const offTop = vv ? vv.offsetTop : 0;
      const kb = Math.max(0, window.innerHeight - visibleH - offTop);
      setVp({ vh: Math.round(visibleH), kbOffset: Math.round(kb) });
    };
    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 900px) and (pointer: fine)");
    const apply = () => setIsDesktopPtr(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (effectivePaused || tourOn || wandering) {
      if (moodTimer.current) { clearTimeout(moodTimer.current); moodTimer.current = null; }
      if (idleTimer.current) { clearTimeout(idleTimer.current); idleTimer.current = null; }
      if (sleepTimer.current) { clearTimeout(sleepTimer.current); sleepTimer.current = null; }
      if (!wandering) setMood("idle");
      return;
    }
    const armIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
      idleTimer.current = setTimeout(() => {
        if (moodRef.current !== "sleeping") setMood("drowsy");
        sleepTimer.current = setTimeout(() => setMood("sleeping"), IDLE_SLEEP_MS);
      }, IDLE_DROWSY_MS);
    };
    const onActivity = (e: Event) => {
      if (e.type === "pointermove") {
        const pe = e as PointerEvent;
        ptrPos.current = { x: pe.clientX, y: pe.clientY };
      }
      const now = Date.now();
      if (e.type === "pointermove" && now - lastActivity.current < 500) return;
      lastActivity.current = now;
      if (moodRef.current === "sleeping" || moodRef.current === "drowsy") {
        setMoodFor("waking", 900);
      }
      armIdle();
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", onActivity, opts);
    window.addEventListener("pointermove", onActivity, opts);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, opts);
    armIdle();
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
    };
  }, [effectivePaused, tourOn, wandering, setMoodFor]);

  useEffect(() => {
    if (typeof window === "undefined" || effectivePaused || tourOn) return;
    const onOver = (e: Event) => {
      const el = e.target as Element | null;
      if (wrapRef.current?.contains(el as Node)) return;
      if (el?.closest?.(".btn-brand, .btn-brand-sm, button[type=submit]")) {
        setMoodFor("excited", 1400);
      }
    };
    const onInvalid = (e: Event) => {
      const el = e.target as Element | null;
      if (wrapRef.current?.contains(el as Node)) return;
      setMoodFor("confused", 1600);
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onOver, { passive: true });
    document.addEventListener("invalid", onInvalid, true);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onOver);
      document.removeEventListener("invalid", onInvalid, true);
    };
  }, [effectivePaused, tourOn, setMoodFor]);

  const [launcherHover, setLauncherHover] = useState(false);
  const introSeenRef = useRef(false);
  const nudgeCount = useRef(0);
  const touredRef = useRef(false);

  const stopRoam = useCallback(() => {
    roamSeq.current++;
    if (roamTimer.current) { clearTimeout(roamTimer.current); roamTimer.current = null; }
    if (bubbleTimer.current) { clearTimeout(bubbleTimer.current); bubbleTimer.current = null; }
    curRoamOff.current = null;
    setRoamOffset(null);
    setBubble(null);
    setTraveling(false);
  }, []);

  const roamWait = useCallback(
    (ms: number) =>
      new Promise<void>((res) => {
        roamTimer.current = setTimeout(res, ms);
      }),
    []
  );

  const spotlightChat = useCallback(() => {
    localSet("tabi-intro", "engaged");
    engagedRef.current = true;
    introSeenRef.current = true;
    stopRoam();
    setSpotlight(false);
    setOpen(true);
    setMinimized(false);
    if (!effectivePaused) setMoodFor("playful", 900);
  }, [effectivePaused, setMoodFor, stopRoam]);

  const spotlightLater = useCallback(() => {
    storageSet("tabi-intro-later", "1");
    introSeenRef.current = true;
    setSpotlight(false);
    if (!effectivePaused) setMoodFor("proud", 1600);
    focusRaf.current = requestAnimationFrame(() => {
      progFocusUntil.current = Date.now() + 400;
      if (launcherRef.current) launcherRef.current.focus();
      else if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus();
    });
  }, [effectivePaused, setMoodFor]);

  const onTourEnd = useCallback(() => {
    setTourOn(false);
    setMood("idle");
  }, []);

  const tour = useTabiTour({
    on: tourOn,
    reducedMotion: effectivePaused,
    hoverPause: launcherHover,
    abort: !isHome || env.blocked || open || minimized || spotlight,
    launcherRef,
    topReservePx: env.topReservePx,
    setMood,
    setRoamOffset,
    setTraveling,
    setFaceDir,
    onEnd: onTourEnd,
  });

  const startTour = useCallback(() => {
    if (!isHome) return;
    localSet("tabi-intro", "engaged");
    engagedRef.current = true;
    introSeenRef.current = true;
    touredRef.current = true;
    stopRoam();
    setSpotlight(false);
    setOpen(false);
    setMinimized(false);
    setTourOn(true);
  }, [isHome, stopRoam]);

  useEffect(() => {
    if (!isHome || spotlight) return;
    if (
      localGet("tabi-intro") === "engaged" ||
      storageGet("tabi-intro-later") === "1"
    ) {
      return;
    }
    const eligible = () =>
      !open &&
      !minimized &&
      !env.blocked &&
      document.visibilityState === "visible" &&
      localGet("tabi-intro") !== "engaged" &&
      storageGet("tabi-intro-later") !== "1";
    spotlightTimer.current = setTimeout(() => {
      spotlightTimer.current = null;
      if (!eligible()) return;
      prevFocus.current = document.activeElement;
      setSpotlight(true);
      if (!effectivePaused) setMoodFor("waking", 900);
    }, 3500);
    return () => {
      if (spotlightTimer.current) clearTimeout(spotlightTimer.current);
    };
  }, [isHome, spotlight, open, minimized, env.blocked, effectivePaused, setMoodFor]);

  useEffect(() => {
    if (!spotlight || effectivePaused) return;
    const seq = [
      setTimeout(() => setMood("excited"), 600),
      setTimeout(() => setMood("happy"), 1600),
      setTimeout(() => setMood("curious"), 3400),
      setTimeout(() => setMood("happy"), 5200),
    ];
    return () => seq.forEach(clearTimeout);
  }, [spotlight, effectivePaused]);

  const introDone =
    introSeenRef.current ||
    touredRef.current ||
    localGet("tabi-intro") === "engaged" ||
    storageGet("tabi-intro-later") === "1";

  const canRoam =
    isHome &&
    !spotlight &&
    !tourOn &&
    !open &&
    !minimized &&
    !env.blocked &&
    !effectivePaused &&
    !engagedRef.current &&
    introDone &&
    isDesktopPtr;

  useEffect(() => {
    if (!canRoam) {
      curRoamOff.current = null;
      setRoamOffset(null);
      setBubble(null);
      setTraveling(false);
      setWandering(false);
      return;
    }
    if (typeof window === "undefined") return;
    if (document.visibilityState !== "visible") return;

    const seq = ++roamSeq.current;
    const alive = () => roamSeq.current === seq;
    curRoamOff.current = null;
    setWandering(true);

    const waypointClear = (left: number, top: number, w: number, h: number) => {
      const pts: [number, number][] = [
        [left + w / 2, top + h / 2],
        [left + 6, top + 6],
        [left + w - 6, top + 6],
        [left + 6, top + h - 6],
        [left + w - 6, top + h - 6],
      ];
      return pts.every(([px, py]) => {
        const hit = (document.elementsFromPoint(px, py) as Element[]).find(
          (el) => !el.closest("[data-tabi-root]")
        );
        if (!hit) return true;
        return !hit.closest("button,a,input,select,textarea,[role=button],h1,h2,.hero-sub");
      });
    };

    const tips = [
      "Ask me anything about TableOS!",
      "Tap me for a tour or to chat.",
      "This button starts your 2 free months.",
      "QR ordering, KDS, billing — ask me how it works.",
      "I can show you around — just click me.",
    ];
    let tipIdx = Math.floor(Math.random() * tips.length);

    const holdForHover = async () => {
      while (alive() && Date.now() < wanderHoldUntil.current) {
        await roamWait(Math.min(wanderHoldUntil.current - Date.now(), 400));
      }
    };

    const runCycle = async () => {
      while (alive()) {
        await roamWait(8000 + Math.random() * 6000);
        if (!alive()) return;
        await holdForHover();
        if (!alive()) return;
        if (moodRef.current === "sleeping" || moodRef.current === "drowsy") continue;
        const l = launcherRef.current;
        if (!l) return;
        const r = l.getBoundingClientRect();
        const cur = curRoamOff.current;
        const baseLeft = r.left - (cur?.x ?? 0);
        const baseTop = r.top - (cur?.y ?? 0);
        const curLeft = r.left;
        const curTop = r.top;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const minY = env.topReservePx + 8;
        const maxY = vh - 120 - r.height;
        const cands: { left: number; top: number }[] = [];
        for (const fx of [0.08, 0.28, 0.5, 0.72, 0.9]) {
          for (const fy of [0.22, 0.45, 0.68]) {
            const left = Math.min(Math.max(fx * vw - r.width / 2, 12), vw - r.width - 12);
            const top = Math.min(Math.max(fy * vh - r.height / 2, minY), Math.max(minY, maxY));
            if (Math.hypot(left - curLeft, top - curTop) < 90) continue;
            if (
              ptrPos.current.x > left - 24 &&
              ptrPos.current.x < left + r.width + 24 &&
              ptrPos.current.y > top - 24 &&
              ptrPos.current.y < top + r.height + 24
            ) {
              continue;
            }
            if (waypointClear(left, top, r.width, r.height)) cands.push({ left, top });
          }
        }
        if (cands.length === 0) continue;
        const wp = cands[Math.floor(Math.random() * cands.length)];
        const off = { x: wp.left - baseLeft, y: wp.top - baseTop };
        curRoamOff.current = off;
        setFaceDir(wp.left >= curLeft ? 1 : -1);
        setTraveling(true);
        setMood("curious");
        setRoamOffset(off);
        await roamWait(1900);
        if (!alive()) return;
        setTraveling(false);
        setMoodFor("happy", 2200);
        if (Math.random() < 0.4) {
          setBubbleFlip(wp.left + r.width / 2 < vw / 2 ? "left" : "right");
          setBubble(tips[tipIdx++ % tips.length]);
          await roamWait(3000);
          if (!alive()) return;
          setBubble(null);
        }
      }
    };

    roamTimer.current = setTimeout(runCycle, 1500);
    return () => {
      roamSeq.current++;
      if (roamTimer.current) { clearTimeout(roamTimer.current); roamTimer.current = null; }
      if (bubbleTimer.current) { clearTimeout(bubbleTimer.current); bubbleTimer.current = null; }
      curRoamOff.current = null;
      setRoamOffset(null);
      setBubble(null);
      setTraveling(false);
      setWandering(false);
    };
  }, [canRoam, env.topReservePx, roamWait, setMoodFor]);

  useEffect(() => {
    if (!isHome || spotlight || tourOn || touredRef.current || open || minimized || env.blocked || effectivePaused) return;
    if (typeof window === "undefined") return;
    const isMobileLike = window.innerWidth < 900 || !window.matchMedia("(pointer: fine)").matches;
    if (!isMobileLike) return;
    const t = setInterval(() => {
      if (
        document.visibilityState !== "visible" ||
        moodRef.current === "sleeping" ||
        moodRef.current === "drowsy" ||
        nudgeCount.current >= 3
      ) {
        return;
      }
      nudgeCount.current++;
      setMoodFor("playful", 900);
      setBubbleFlip("right");
      setBubble("Hi, I'm Tabi! Click me to chat.");
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 3500);
    }, 20000);
    return () => clearInterval(t);
  }, [isHome, spotlight, tourOn, open, minimized, env.blocked, effectivePaused, setMoodFor]);

  const lastToastHandled = useRef<string | null>(null);
  useEffect(() => {
    if (!latestToastId) return;
    if (latestToastId === lastToastHandled.current) return;
    lastToastHandled.current = latestToastId;
    if (effectivePaused) return;
    if (latestToastType === "success") setMoodFor("celebrate", 1600);
    else if (latestToastType === "error") setMoodFor("confused", 1600);
  }, [latestToastId, latestToastType, effectivePaused, setMoodFor]);

  const prevIdentity = useRef(identityKey);
  useEffect(() => {
    if (prevIdentity.current === identityKey) return;
    prevIdentity.current = identityKey;
    cancelRequest();
    stopRoam();
    tour.skip();
    if (spotlightTimer.current) { clearTimeout(spotlightTimer.current); spotlightTimer.current = null; }
    if (spotlight) setSpotlight(false);
    setMessages([]);
    setInlineError(null);
    setSending(false);
    setInput("");
    setOpen(false);
    setMinimized(false);
    if (moodTimer.current) { clearTimeout(moodTimer.current); moodTimer.current = null; }
    setMood("idle");
  }, [identityKey, cancelRequest, spotlight, stopRoam, tour.skip]);

  useEffect(
    () => () => {
      cancelRequest();
      stopRoam();
      if (moodTimer.current) clearTimeout(moodTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
      if (spotlightTimer.current) clearTimeout(spotlightTimer.current);
      if (autofocusRaf.current) cancelAnimationFrame(autofocusRaf.current);
      if (focusRaf.current) cancelAnimationFrame(focusRaf.current);
    },
    [cancelRequest, stopRoam]
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return;
    autofocusRaf.current = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      if (autofocusRaf.current) cancelAnimationFrame(autofocusRaf.current);
    };
  }, [open]);

  const closePanel = useCallback(() => {
    setOpen(false);
    focusRaf.current = requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const minimizePanel = useCallback(() => {
    setOpen(false);
    setMinimized(true);
    focusRaf.current = requestAnimationFrame(() => restoreRef.current?.focus());
  }, []);

  const send = useCallback(
    async (rawText: string) => {
      const text = Array.from(rawText.trim()).slice(0, 1000).join("");
      if (!text) return;
      if (isHome && text === TOUR_SUGGESTION) {
        setInlineError(null);
        setMessages((prev) =>
          [
            ...prev,
            { role: "user" as const, text },
            {
              role: "assistant" as const,
              text: "Follow me — I'll show you around!",
              source: "guide" as const,
            },
          ].slice(-MAX_VISIBLE)
        );
        setInput("");
        startTour();
        return;
      }
      if (requestRef.current) return;
      setInlineError(null);

      const prevMessages = messages;
      const prevInput = input;
      const startedIdentity = identityRef.current;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
      requestRef.current = { controller, timer };

      const nextMessages = [...prevMessages, { role: "user" as const, text }].slice(-MAX_VISIBLE);
      setMessages(nextMessages);
      setInput("");
      setSending(true);

      try {
        const reply = await askAssistant(text, ctx.page, prevMessages, controller.signal);
        if (
          requestRef.current?.controller !== controller ||
          identityRef.current !== startedIdentity
        ) {
          return;
        }
        setMessages((prev) =>
          [
            ...prev,
            { role: "assistant" as const, text: reply.answer, source: reply.source },
          ].slice(-MAX_VISIBLE)
        );
        setInlineError(null);
        if (!effectivePaused) setMoodFor("happy", 1800);
      } catch (err: unknown) {
        if (
          requestRef.current?.controller !== controller ||
          identityRef.current !== startedIdentity
        ) {
          return;
        }
        setMessages(prevMessages);
        setInput(prevInput || text);
        if ((err as Error)?.name === "AbortError") {
          setInlineError(TIMEOUT_ERROR);
        } else if (err instanceof AssistantRequestError) {
          setInlineError(err.message);
        } else {
          setInlineError(GENERIC_ERROR);
        }
        if (!effectivePaused) setMoodFor("confused", 2000);
      } finally {
        if (
          requestRef.current?.controller === controller &&
          identityRef.current === startedIdentity
        ) {
          requestRef.current = null;
          clearTimeout(timer);
          setSending(false);
        }
      }
    },
    [messages, input, ctx.page, effectivePaused, setMoodFor, isHome, startTour]
  );

  const toggleOpen = () => {
    const willOpen = !open;
    if (willOpen) engagedRef.current = true;
    if (tourOn) tour.skip();
    curRoamOff.current = null;
    setRoamOffset(null);
    setBubble(null);
    setTraveling(false);
    if (!effectivePaused) setMoodFor(willOpen ? "playful" : "idle", willOpen ? 700 : undefined);
    if (willOpen) {
      setOpen(true);
      setMinimized(false);
    } else {
      closePanel();
    }
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closePanel();
    }
  };

  const resetConversation = () => {
    cancelRequest();
    setMessages([]);
    setInlineError(null);
    setSending(false);
    setInput("");
    if (moodTimer.current) clearTimeout(moodTimer.current);
    setMood("idle");
  };

  const mascotSize = isSmallScreen ? 60 : 96;
  const effectiveMood: MascotMood = sending ? "thinking" : mood;
  const tourHop = tourOn && tour.stationary;
  const mascotHopCls = tourHop
    ? styles.hopOnce
    : effectiveMood === "celebrate" || effectiveMood === "excited"
      ? styles.hop
      : "";

  const wrapStyle = {
    ...env.vars,
    "--tabi-vh": `${vp.vh || 0}px`,
    "--tabi-keyboard-offset": `${vp.kbOffset}px`,
  } as React.CSSProperties;

  const standalone = open && (isSmallScreen || (vp.vh > 0 && vp.vh < 560));

  return (
    <div
      ref={wrapRef}
      data-tabi-root
      data-side={side}
      data-blocked={env.blocked}
      data-standalone={standalone}
      data-tour={tourOn ? "true" : "false"}
      data-tour-step={tour.step || undefined}
      className={`${styles.wrap} ${effectivePaused ? styles.paused : ""}`}
      style={wrapStyle}
    >
      <span className={styles.srOnly} aria-live="polite">
        {tour.liveText}
      </span>
      {open && !env.blocked && (
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-label="Tabi · TableOS helper"
          id="tabi-panel"
          onKeyDown={onPanelKeyDown}
        >
          <div className={styles.panelHeader}>
            <TabiMascot mood={effectiveMood} paused={effectivePaused} size={34} />
            <div className={styles.panelTitle}>
              <span>Tabi · TableOS helper</span>
              <small>{ctx.label}</small>
            </div>
            <div className={styles.panelControls}>
              <button
                className={styles.iconBtn}
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume animations" : "Pause animations"}
                aria-pressed={paused}
                title={paused ? "Resume animations" : "Pause animations"}
              >
                {paused ? <Play /> : <Pause />}
              </button>
              <button
                className={styles.iconBtn}
                onClick={() => {
                  const next = side === "right" ? "left" : "right";
                  setSide(next);
                  storageSet("tabi-side", next);
                }}
                aria-label={`Move helper to the ${side === "right" ? "left" : "right"}`}
                title={`Move to ${side === "right" ? "left" : "right"}`}
              >
                {side === "right" ? <ArrowLeft /> : <ArrowRight />}
              </button>
              <button
                className={styles.iconBtn}
                onClick={resetConversation}
                aria-label="Reset conversation"
                title="Reset conversation"
              >
                <RotateCcw />
              </button>
              <button
                className={styles.iconBtn}
                onClick={minimizePanel}
                aria-label="Minimize helper"
                title="Minimize"
              >
                <Minus />
              </button>
              <button
                className={styles.iconBtn}
                onClick={closePanel}
                aria-label="Close Tabi"
                title="Close"
              >
                <X />
              </button>
            </div>
          </div>

          <div
            className={styles.panelBody}
            role="log"
            aria-live="polite"
            ref={logRef}
            aria-busy={sending}
          >
            {messages.length === 0 && (
              <div className={styles.privacy}>
                Guidance only — I cannot view live restaurant data or make changes.
                Messages you send may be processed by Google Gemini. Do not share
                passwords, OTPs, card details, or guest information.
              </div>
            )}
            {messages.length === 0 && !sending && (
              <div className={`${styles.msg} ${styles.msgBot}`}>
                Hi, I'm Tabi. Ask me anything about TableOS.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.msg} ${
                  m.role === "user" ? styles.msgUser : styles.msgBot
                }`}
              >
                {m.text}
                {m.role === "assistant" && m.source && (
                  <span className={styles.srcTag}>
                    {m.source === "gemini" ? "Gemini" : "Built-in guide"}
                  </span>
                )}
              </div>
            ))}
            {sending && (
              <div className={`${styles.msg} ${styles.msgBot}`}>Tabi is thinking…</div>
            )}
            {inlineError && (
              <div className={styles.errMsg} role="alert">
                {inlineError}
              </div>
            )}
            {messages.length === 0 && (
              <div className={styles.suggestions}>
                {ctx.suggestions.map((s) => (
                  <button
                    key={s}
                    className={styles.chip}
                    onClick={() => send(s)}
                    disabled={sending}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.composer}>
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              maxLength={1000}
              placeholder="Ask Tabi…"
              aria-label="Message Tabi"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKeyDown}
              onFocus={() => {
                if (!effectivePaused && !sending) setMoodFor("listening", 2500);
              }}
              readOnly={sending}
              aria-busy={sending}
            />
            <button
              className={styles.sendBtn}
              onClick={() => send(input)}
              disabled={sending || input.trim() === ""}
              aria-label="Send message"
            >
              <Send /> Send
            </button>
          </div>
        </div>
      )}

      {minimized ? (
        <button
          ref={restoreRef}
          className={styles.restoreTab}
          onClick={() => {
            setMinimized(false);
            setOpen(true);
          }}
          aria-label="Restore Tabi helper"
        >
          <Bell />
        </button>
      ) : (
        !standalone &&
        !spotlight && (
          <div
            className={styles.roamLayer}
            style={
              roamOffset && !effectivePaused
                ? { transform: `translate(${roamOffset.x}px, ${roamOffset.y}px)` }
                : undefined
            }
          >
            {tour.caption ? (
              <div
                className={styles.cloudBubble}
                data-flip={tour.flip}
                data-pos={tour.below ? "below" : "above"}
                aria-hidden="true"
                onClick={tour.next}
              >
                <div>{tour.caption}</div>
                <div className={styles.cloudNav}>
                  <button
                    type="button"
                    className={styles.cloudBtn}
                    tabIndex={-1}
                    disabled={tour.step <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      tour.back();
                    }}
                  >
                    ‹ Back
                  </button>
                  <span className={styles.cloudCount}>{tour.counter ?? ""}</span>
                  <button
                    type="button"
                    className={`${styles.cloudBtn} ${styles.cloudBtnPrimary}`}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      tour.next();
                    }}
                  >
                    Next ›
                  </button>
                </div>
                <div className={styles.cloudFoot}>
                  <button
                    type="button"
                    className={styles.cloudSkip}
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      tour.skip();
                    }}
                  >
                    Skip tour
                  </button>
                </div>
              </div>
            ) : (
              bubble && (
                <div className={styles.bubble} data-flip={bubbleFlip} aria-hidden="true">
                  {bubble}
                </div>
              )
            )}
            <button
              ref={launcherRef}
              className={styles.launcher}
              onClick={toggleOpen}
              onMouseEnter={() => {
                setLauncherHover(true);
                wanderHoldUntil.current = Infinity;
                if (!effectivePaused && !sending && mood === "idle") setMoodFor("excited", 1200);
              }}
              onMouseLeave={() => {
                setLauncherHover(false);
                wanderHoldUntil.current = Date.now() + 4000;
              }}
              onFocus={() => {
                setLauncherHover(true);
                wanderHoldUntil.current =
                  Date.now() < progFocusUntil.current ? Date.now() + 4000 : Infinity;
              }}
              onBlur={() => {
                setLauncherHover(false);
                wanderHoldUntil.current = Date.now() + 4000;
              }}
              aria-label="Open Tabi, TableOS helper"
              aria-expanded={open}
              aria-controls="tabi-panel"
            >
              <span className={styles.launcherLabel}>Ask Tabi</span>
              <span
                key={tourHop ? `hop-${tour.hopTick}` : "mascot"}
                className={`${styles.mascotHolder} ${mascotHopCls}`}
              >
                <TabiMascot
                  mood={effectiveMood}
                  paused={effectivePaused}
                  size={mascotSize}
                  traveling={traveling}
                  faceDir={faceDir}
                />
              </span>
            </button>
          </div>
        )
      )}

      {spotlight && isHome && !env.blocked && (
        <TabiSpotlight
          mood={effectivePaused ? "idle" : effectiveMood}
          paused={effectivePaused}
          onTour={startTour}
          onChat={spotlightChat}
          onLater={spotlightLater}
        />
      )}
    </div>
  );
}
