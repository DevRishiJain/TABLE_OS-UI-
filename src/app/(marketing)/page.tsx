"use client";

import React, { useEffect, useRef, useState } from "react";
import { ContactConciergeForm } from "@/components/marketing/ContactConciergeForm";
import { THEME_OPTIONS, useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";

// ── Static data ──
const ORDERS = [
  ["T4", "Butter chicken, naan × 2, biryani", 1180],
  ["T9", "Paneer tikka, lime soda", 420],
  ["T2", "Tasting menu × 2", 3600],
  ["T7", "Cold coffee, brownie", 380],
  ["T1", "Dal makhani, roti × 4", 560],
  ["T12", "Sunset mocktail × 3", 690],
  ["T5", "Room 412 · Club sandwich", 520],
] as const;

const KDS_ITEMS = [
  ["T4 Biryani", 0.03, 0.28, 0.62],
  ["T9 Naan × 4", 0.10, 0.30, 0.50],
  ["T2 Tasting menu", 0.18, 0.40, 0.78],
  ["T7 Tikka", 0.26, 0.46, 0.90],
  ["T1 Dessert × 2", 0.34, 0.50, 0.70],
  ["T12 Mocktails", 0.42, 0.60, 0.85],
] as const;

const TABLES = [
  [130, 110],
  [260, 90],
  [400, 110],
  [520, 90],
  [110, 260],
  [250, 290],
  [400, 270],
  [530, 280],
] as const;

const CALLS = [
  [2, 0.06, "Call waiter"],
  [5, 0.28, "Request bill"],
  [0, 0.50, "Need water"],
  [7, 0.72, "Call waiter"],
] as const;

const WASTE_ITEMS = [
  ["Tomatoes", 60, 18],
  ["Paneer",   48, 12],
  ["Cream",    54,  9],
  ["Bread",    68, 24],
  ["Greens",   40, 14],
] as const;

const THEMES = [
  { key: "",        color: "#E9B24C", label: "Imperial amber" },
  { key: "jade",    color: "#4BD6A0", label: "Botanical jade" },
  { key: "scarlet", color: "#FF6A5C", label: "Crimson scarlet" },
  { key: "violet",  color: "#B79CFF", label: "Velvet violet" },
  { key: "cobalt",  color: "#5CCBFF", label: "Ocean cobalt" },
  { key: "rose",    color: "#FF8FB0", label: "Sunset rose" },
];

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export default function LandingPage() {
  const { currentTheme, setTheme } = useRestaurantTheme?.() ?? { currentTheme: "", setTheme: () => {} };

  // ── Refs for each chapter section ──
  const chap0 = useRef<HTMLDivElement>(null);
  const chap1 = useRef<HTMLDivElement>(null);
  const chap2 = useRef<HTMLDivElement>(null);
  const chap3 = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  // ── Declarative scroll progress state for all 4 chapters (0 to 1) ──
  const [progress, setProgress] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  // ── Hero cursor spotlight ──
  useEffect(() => {
    const hero = heroRef.current;
    const dark = darkRef.current;
    if (!hero || !dark) return;
    if (!matchMedia("(hover:hover)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      dark.style.setProperty("--mx", (e.clientX - r.left) + "px");
      dark.style.setProperty("--my", (e.clientY - r.top) + "px");
    };
    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  // ── Passive scroll listener with requestAnimationFrame ──
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const vh = window.innerHeight;
        const chapters = [chap0.current, chap1.current, chap2.current, chap3.current];
        const next = chapters.map((el) => {
          if (!el) return 0;
          const rect = el.getBoundingClientRect();
          const denom = rect.height - vh;
          return denom > 0 ? clamp(-rect.top / denom, 0, 1) : 0;
        }) as [number, number, number, number];

        setProgress((prev) => {
          if (
            Math.abs(prev[0] - next[0]) < 0.001 &&
            Math.abs(prev[1] - next[1]) < 0.001 &&
            Math.abs(prev[2] - next[2]) < 0.001 &&
            Math.abs(prev[3] - next[3]) < 0.001
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll(); // Initial evaluation

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const [p0, p1, p2, p3] = progress;

  // ══════════════════════════════════════════════════
  // CHAPTER 01 (Orders) derived state
  // ══════════════════════════════════════════════════
  const orderCount = Math.floor(clamp(p0 / 0.8) * ORDERS.length + 0.001);
  const revenue = ORDERS.slice(0, orderCount).reduce((s, o) => s + (o[2] as number), 0);
  const ordersPerMinute = Math.round(p0 * 12);

  // ══════════════════════════════════════════════════
  // CHAPTER 02 (KDS) derived state
  // ══════════════════════════════════════════════════
  const derivedTickets = KDS_ITEMS.map(([label, startAt, cookAt, readyAt]) => {
    // p < startAt → hidden; p < cookAt → New; p < readyAt → Cooking; otherwise → At the pass
    const col = p1 < startAt ? -1 : p1 < cookAt ? 0 : p1 < readyAt ? 1 : 2;
    const seconds = Math.max(0, Math.floor((p1 - startAt) * 900));
    const m = Math.floor(seconds / 60);
    const ss = String(seconds % 60).padStart(2, "0");
    const isLate = col === 1 && seconds > 300;
    const isDone = col === 2;
    const subtext = col === 0 ? "Waiting" : col === 1 ? "Cooking" : "Checked at the pass";
    return {
      label,
      startAt,
      cookAt,
      readyAt,
      col,
      seconds,
      timeStr: `${m}:${ss}`,
      isLate,
      isDone,
      subtext,
    };
  });

  const newTickets = derivedTickets.filter((t) => t.col === 0);
  const cookingTickets = derivedTickets.filter((t) => t.col === 1);
  const passTickets = derivedTickets.filter((t) => t.col === 2);

  // Header counter: number of tickets not yet in "At the pass" + " active"
  const activeTicketsCount = derivedTickets.filter((t) => t.col === 0 || t.col === 1).length;
  const lateTicketsCount = derivedTickets.filter((t) => t.isLate).length;
  const lateCaughtStat = Math.max(lateTicketsCount, Math.round(p1 * 3));

  // ══════════════════════════════════════════════════
  // CHAPTER 03 (Waiter) derived state
  // ══════════════════════════════════════════════════
  let activeTarget: readonly [number, number] | null = null;
  let requestsAnswered = 0;

  CALLS.forEach((c) => {
    const isCallActive = p2 >= c[1] && p2 < c[1] + 0.18;
    if (isCallActive) {
      activeTarget = TABLES[c[0] as number];
    }
    if (p2 >= c[1] + 0.18) {
      requestsAnswered++;
    }
  });

  const waiterPos = activeTarget ?? [60, 210];
  const tx = activeTarget
    ? waiterPos[0] < 300
      ? waiterPos[0] + 36
      : waiterPos[0] - 36
    : 60;
  const ty = waiterPos[1];

  // ══════════════════════════════════════════════════
  // CHAPTER 04 (Waste) derived state
  // ══════════════════════════════════════════════════
  const wasteK = clamp(p3 / 0.85);
  const wasteReductionPct = Math.round(38 * wasteK);
  const wasteLoggedVal = Math.round(4200 - 1600 * wasteK);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <header className="tos-hero" id="top" ref={heroRef}>
        {/* SVG scene */}
        <svg className="hero-svg" viewBox="0 0 800 700" aria-hidden="true">
          <defs>
            <radialGradient id="g">
              <stop offset="0" stopColor="var(--b)" stopOpacity=".6"/>
              <stop offset="1" stopColor="var(--b)" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--b)"/>
              <stop offset="1" stopColor="var(--b2)"/>
            </linearGradient>
          </defs>
          <circle cx="400" cy="350" r="350" fill="url(#g)"/>
          <circle cx="400" cy="350" r="255" fill="#1d1710" stroke="#f4ecdd22"/>
          <circle cx="400" cy="350" r="195" fill="#f4ecdd" opacity=".93"/>
          <circle cx="400" cy="350" r="152" fill="none" stroke="#0b090722" strokeWidth="2"/>
          <circle cx="400" cy="350" r="64" fill="url(#gd)"/>
          <circle cx="380" cy="330" r="18" fill="#fff" opacity=".35"/>
          <rect x="150" y="190" width="16" height="320" rx="8" fill="#d9cdb6"/>
          <path d="M650 190 q-32 120 0 190 v130" stroke="#d9cdb6" strokeWidth="16" fill="none" strokeLinecap="round"/>
          <circle cx="620" cy="120" r="50" fill="#ffffff10" stroke="#f4ecdd44"/>
          <circle cx="620" cy="120" r="21" fill="var(--b2)" opacity=".7"/>
        </svg>

        {/* Spotlight */}
        <div className="hero-dark" ref={darkRef} />

        {/* Hero copy */}
        <div className="rise">
          <div className="hero-pill">
            <b>2 months free</b>No setup cost, no platform fee
          </div>
          <h1>
            Every table,<br />
            <em>perfectly</em> timed.
          </h1>
          <p className="hero-sub">
            Orders, kitchen, waiter calls and wastage in one live system for restaurants, bars, hotels and cloud kitchens.
          </p>
          <div className="hero-cta">
            <a className="btn-brand" href="#contact">Start 2 free months</a>
            <a className="btn-outline" href="#orders">See it in action</a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hero-tick">
          <div>&lt;30s<small>from scan to order</small></div>
          <div>100%<small>orders checked at the pass</small></div>
          <div>1 tap<small>to call a waiter</small></div>
          <div>−38%<small>average wastage</small></div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          CHAPTER 01 — Orders
      ══════════════════════════════════════════════════ */}
      <section className="chap" id="orders" ref={chap0}>
        <div className="chap-pin">
          {/* Left */}
          <div>
            <div className="chap-num">01 · Order management</div>
            <h2>Every order, <em>one stream.</em></h2>
            <p>Dine-in, room service, drive-in and takeaway orders land in one live feed, accepted and routed with the table number attached.</p>
            <div className="chap-facts">
              <div>Orders per minute<span id="f0">{ordersPerMinute}</span></div>
              <div>Average accept time<span>4 sec</span></div>
            </div>
            <div className="chap-prog">
              <span className="chap-prog-bar" style={{ width: `${p0 * 100}%` }} />
            </div>
          </div>
          {/* Right viz */}
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Live orders</span>
              <span>Tonight</span>
            </div>
            <div className="order-list">
              {ORDERS.map((o, i) => {
                const isOn = i < orderCount;
                const isAccepted = i < orderCount - 2;
                return (
                  <div className={`order-row or ${isOn ? "on" : ""}`} key={i}>
                    <b>{o[0]}</b>
                    <div>{o[1]}<small>Sent to kitchen</small></div>
                    <u>₹{o[2]}</u>
                    <span className={`order-status st ${isAccepted ? "accepted" : ""}`}>
                      {isAccepted ? "Accepted" : "New"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="order-total">
              <span>Revenue so far</span>
              <b id="rev">₹{revenue.toLocaleString("en-IN")}</b>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CHAPTER 02 — KDS
      ══════════════════════════════════════════════════ */}
      <section className="chap" id="kds" ref={chap1}>
        <div className="chap-pin">
          <div>
            <div className="chap-num">02 · Kitchen display</div>
            <h2>Tickets that <em>move themselves.</em></h2>
            <p>Each ticket flows from new to cooking to the pass. Timers turn red before a guest notices a delay.</p>
            <div className="chap-facts">
              <div>Avg prep time<span>11 min</span></div>
              <div>Late tickets caught<span id="f1">{lateCaughtStat}</span></div>
            </div>
            <div className="chap-prog">
              <span className="chap-prog-bar" style={{ width: `${p1 * 100}%` }} />
            </div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Kitchen display</span>
              <span id="kt">{activeTicketsCount} active</span>
            </div>
            <div className="kds-board kb">
              {/* Column 0: New */}
              <div className="kds-col kc">
                <small>New</small>
                {newTickets.length === 0 ? (
                  <div
                    className="kds-empty"
                    style={{
                      color: "var(--mute)",
                      fontSize: "0.85rem",
                      padding: "10px 4px",
                      opacity: 0.7,
                      fontStyle: "italic",
                    }}
                  >
                    Waiting for orders
                  </div>
                ) : (
                  newTickets.map((t) => (
                    <div
                      key={t.label}
                      className={`tk kds-ticket ${t.isLate ? "late" : ""} ${t.isDone ? "done dn" : ""}`}
                    >
                      <b>
                        {t.label}
                        <span>{t.isDone ? "Ready" : t.timeStr}</span>
                      </b>
                      <small>{t.subtext}</small>
                    </div>
                  ))
                )}
              </div>

              {/* Column 1: Cooking */}
              <div className="kds-col kc">
                <small>Cooking</small>
                {cookingTickets.map((t) => (
                  <div
                    key={t.label}
                    className={`tk kds-ticket ${t.isLate ? "late" : ""} ${t.isDone ? "done dn" : ""}`}
                  >
                    <b>
                      {t.label}
                      <span>{t.isDone ? "Ready" : t.timeStr}</span>
                    </b>
                    <small>{t.subtext}</small>
                  </div>
                ))}
              </div>

              {/* Column 2: At the pass */}
              <div className="kds-col kc">
                <small>At the pass</small>
                {passTickets.map((t) => (
                  <div
                    key={t.label}
                    className={`tk kds-ticket ${t.isLate ? "late" : ""} ${t.isDone ? "done dn" : ""}`}
                  >
                    <b>
                      {t.label}
                      <span>{t.isDone ? "Ready" : t.timeStr}</span>
                    </b>
                    <small>{t.subtext}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CHAPTER 03 — Waiter
      ══════════════════════════════════════════════════ */}
      <section className="chap" id="waiter" ref={chap2}>
        <div className="chap-pin">
          <div>
            <div className="chap-num">03 · Waiter calling</div>
            <h2>One tap, <em>a waiter arrives.</em></h2>
            <p>Guests tap call waiter, ask for water or request the bill. The closest free waiter gets the alert with the table number.</p>
            <div className="chap-facts">
              <div>Avg response<span>38 sec</span></div>
              <div>Requests answered<span id="f2">{requestsAnswered}</span></div>
            </div>
            <div className="chap-prog">
              <span className="chap-prog-bar" style={{ width: `${p2 * 100}%` }} />
            </div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Floor view</span>
              <span>Waiter: Ananya</span>
            </div>
            <div className="floor-wrap">
              <svg viewBox="0 0 640 420" id="floor">
                <rect x="6" y="6" width="628" height="408" rx="22" fill="none" stroke="#f4ecdd22" />
                <rect x="6" y="160" width="40" height="100" fill="#ffffff10" />
                <text x="14" y="215" fontSize="11" fill="#A09684" fontFamily="sans-serif">
                  Kitchen
                </text>
                {TABLES.map((t, i) => {
                  const isRinging = CALLS.some(
                    (c) => c[0] === i && p2 >= c[1] && p2 < c[1] + 0.18
                  );
                  return (
                    <g key={i}>
                      <circle cx={t[0]} cy={t[1]} r="30" fill="#1d1710" stroke="#f4ecdd33" />
                      <text
                        x={t[0]}
                        y={t[1] + 5}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="800"
                        fill="#F4ECDD"
                        fontFamily="sans-serif"
                      >
                        T{i + 1}
                      </text>
                      <circle
                        className="table-ring ring"
                        data-ring={i}
                        id={`r${i}`}
                        cx={t[0]}
                        cy={t[1]}
                        r="30"
                        fill="none"
                        stroke="var(--b)"
                        strokeWidth="3"
                        opacity={isRinging ? 1 : 0}
                      />
                    </g>
                  );
                })}
                <g
                  className="waiter-dot wt"
                  id="wt"
                  style={{ transform: `translate(${tx}px,${ty}px)` }}
                >
                  <circle r="14" fill="var(--b)" />
                  <circle r="5" fill="#1b1206" />
                </g>
              </svg>
              <div className="alert-stack">
                {CALLS.map((c, i) => {
                  const isAlertOn = p2 >= c[1] && p2 < c[1] + 0.24;
                  return (
                    <div className={`alert-card alr ${isAlertOn ? "on" : ""}`} key={i}>
                      <small>Table {(c[0] as number) + 1}</small>
                      {c[2]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CHAPTER 04 — Wastage
      ══════════════════════════════════════════════════ */}
      <section className="chap" id="waste" ref={chap3}>
        <div className="chap-pin">
          <div>
            <div className="chap-num">04 · Wastage management</div>
            <h2>Waste you can <em>finally see.</em></h2>
            <p>Every dish deducts its ingredients, so spoilage and over-prep are logged and trimmed before they reach the bin.</p>
            <div className="chap-facts">
              <div>Waste logged<span id="f3">₹{wasteLoggedVal.toLocaleString("en-IN")}</span></div>
              <div>Supplier order<span>Auto-drafted</span></div>
            </div>
            <div className="chap-prog">
              <span className="chap-prog-bar" style={{ width: `${p3 * 100}%` }} />
            </div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Stock and waste</span>
              <span>This week</span>
            </div>
            <div className="waste-list">
              {WASTE_ITEMS.map((w, i) => {
                const currentWaste = w[2] * (1 - 0.6 * wasteK);
                return (
                  <div className="waste-row" key={i}>
                    <span style={{ color: "var(--ink)", textAlign: "left" }}>{w[0]}</span>
                    <div className="waste-bar">
                      <span className="used" style={{ width: `${w[1]}%` }} />
                      <span className="wasted" style={{ width: `${currentWaste}%` }} />
                    </div>
                    <span className="waste-pct">{currentWaste.toFixed(0)}% waste</span>
                  </div>
                );
              })}
            </div>
            <div className="waste-total">
              <span>Wastage vs last month</span>
              <b id="wp">−{wasteReductionPct}%</b>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VENUE STRIP
      ══════════════════════════════════════════════════ */}
      <section id="venues" style={{ paddingTop: 140, paddingBottom: 0 }}>
        <h2 style={{ padding: "0 var(--px)", marginBottom: 60 }}>
          Built for <em>every</em> kind of room.
        </h2>
        <div className="ven-grid">
          <div className="ven-item">
            <h3>Fine dining</h3>
            <p>Course pacing, drink pairing and split bills.</p>
          </div>
          <div className="ven-item">
            <h3>Drive-in bars</h3>
            <p>Order from the car with a QR on every bay.</p>
          </div>
          <div className="ven-item">
            <h3>Cafes and bakeries</h3>
            <p>Fast orders, pastry stock and takeaway packaging.</p>
          </div>
          <div className="ven-item">
            <h3>Hotel rooms</h3>
            <p>In-room QR cards routed to one kitchen.</p>
          </div>
          <div className="ven-item" style={{ borderRight: 0 }}>
            <h3>Cloud kitchens</h3>
            <p>Batch tickets across brands with shared stock.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          THEME PICKER
      ══════════════════════════════════════════════════ */}
      <section className="theme-section" id="themes">
        <h2>Your venue, <em>your colors.</em></h2>
        <p>Every restaurant gets its own palette across the guest app and staff screens. Pick one and this whole page changes.</p>
        <div className="theme-switcher">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className="theme-btn"
              aria-pressed={currentTheme === t.key || (!currentTheme && t.key === "") ? "true" : "false"}
              onClick={() => {
                if (t.key) {
                  document.documentElement.setAttribute("data-theme", t.key);
                  localStorage.setItem("tableos-theme", t.key);
                } else {
                  document.documentElement.removeAttribute("data-theme");
                  localStorage.removeItem("tableos-theme");
                }
                setTheme?.(t.key);
              }}
            >
              <span className="theme-dot" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CONTACT / DEMO
      ══════════════════════════════════════════════════ */}
      <section className="contact-grid" id="contact">
        <div>
          <h2>Let's set up <em>your venue.</em></h2>
          <p style={{ color: "var(--mute)", marginTop: 24, maxWidth: "44ch", fontSize: "1.1rem" }}>
            We'll build your menu and table layout with you, then switch on two free months. No credit card needed.
          </p>
          <div className="contact-care">
            <div>
              <small>Toll-free hotline</small>
              <b>+91 1800 890 3240</b>
            </div>
            <div>
              <small>Concierge email</small>
              <b>concierge@tableos.in</b>
            </div>
            <div>
              <small>Support</small>
              <b>24/7 priority help and on-site setup</b>
            </div>
          </div>
        </div>
        <ContactConciergeForm />
      </section>
    </>
  );
}
