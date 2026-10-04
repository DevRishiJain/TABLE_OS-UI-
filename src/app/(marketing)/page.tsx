"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ContactConciergeForm } from "@/components/marketing/ContactConciergeForm";
import { THEME_OPTIONS, useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";

// ── Static data (replace placeholder figures with real ones if available) ──
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
  ["T9 Naan × 4", 0.1, 0.3, 0.5],
  ["T2 Tasting menu", 0.18, 0.4, 0.78],
  ["T7 Tikka", 0.26, 0.46, 0.9],
  ["T1 Dessert × 2", 0.34, 0.5, 0.7],
  ["T12 Mocktails", 0.42, 0.6, 0.85],
] as const;

const TABLES = [[130,110],[260,90],[400,110],[520,90],[110,260],[250,290],[400,270],[530,280]] as const;
const CALLS = [[2, 0.06, "Call waiter"], [5, 0.28, "Request bill"], [0, 0.5, "Need water"], [7, 0.72, "Call waiter"]] as const;

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

  // ── Refs for each chapter ──
  const chap0 = useRef<HTMLDivElement>(null);
  const chap1 = useRef<HTMLDivElement>(null);
  const chap2 = useRef<HTMLDivElement>(null);
  const chap3 = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  // ── KDS ticket elements held in ref ──
  const kdsTickets = useRef<HTMLDivElement[]>([]);
  const kdsColsRef = useRef<HTMLDivElement[]>([]);

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

  // ── Scroll-driven chapter updates ──
  const updateChapters = useCallback(() => {
    const vh = window.innerHeight;
    const chapters = [chap0, chap1, chap2, chap3];

    chapters.forEach((ref, i) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));

      // Progress bar
      const bar = el.querySelector<HTMLElement>(".chap-prog-bar");
      if (bar) bar.style.width = p * 100 + "%";

      if (r.top > vh || r.bottom < 0) return; // not in view

      if (i === 0) updateOrders(el, p);
      if (i === 1) updateKDS(el, p);
      if (i === 2) updateWaiter(el, p);
      if (i === 3) updateWaste(el, p);
    });
  }, []);

  function updateOrders(el: HTMLElement, p: number) {
    const n = Math.floor(clamp(p / 0.8) * ORDERS.length + 0.001);
    const rows = el.querySelectorAll<HTMLElement>(".order-row");
    rows.forEach((row, i) => {
      row.classList.toggle("on", i < n);
      const st = row.querySelector(".order-status");
      if (st) {
        const accepted = i < n - 2;
        st.textContent = accepted ? "Accepted" : "New";
        st.classList.toggle("accepted", accepted);
      }
    });
    const rev = el.querySelector<HTMLElement>("#rev");
    if (rev) rev.textContent = "₹" + ORDERS.slice(0, n).reduce((s, o) => s + (o[2] as number), 0).toLocaleString("en-IN");
    const f0 = el.querySelector<HTMLElement>("#f0");
    if (f0) f0.textContent = String(Math.round(p * 12));
  }

  function updateKDS(el: HTMLElement, p: number) {
    const cols = el.querySelectorAll<HTMLElement>(".kds-col");
    const tickets = kdsTickets.current;
    let act = 0, late = 0;
    KDS_ITEMS.forEach((k, i) => {
      const t = tickets[i];
      if (!t) return;
      const col = p < k[1] ? -1 : p < k[2] ? 0 : p < k[3] ? 1 : 2;
      const prev = parseInt(t.dataset.col ?? "-1");
      if (col !== prev) {
        t.dataset.col = String(col);
        if (col >= 0 && cols[col]) cols[col].appendChild(t);
      }
      if (col >= 0) {
        const s = Math.floor((p - k[1]) * 900);
        const isLate = col === 1 && s > 300;
        t.className = "kds-ticket" + (isLate ? " late" : col === 2 ? " done" : "");
        t.innerHTML = `<b>${k[0]}<span>${col === 2 ? "Ready" : Math.floor(s/60) + ":" + String(s%60).padStart(2,"0")}</span></b><small>${col === 0 ? "Waiting" : col === 1 ? "Cooking" : "Checked at the pass"}</small>`;
        if (isLate) late++;
        if (col < 2) act++;
      }
    });
    const kt = el.querySelector<HTMLElement>("#kt");
    if (kt) kt.textContent = act + " active";
    const f1 = el.querySelector<HTMLElement>("#f1");
    if (f1) f1.textContent = String(Math.max(late, Math.round(p * 3)));
  }

  function updateWaiter(el: HTMLElement, p: number) {
    const rings = el.querySelectorAll<SVGElement>("[data-ring]");
    const alerts = el.querySelectorAll<HTMLElement>(".alert-card");
    const wt = el.querySelector<SVGGElement>("#wt");
    let target: readonly [number, number] | null = null;
    let done = 0;

    CALLS.forEach((c, i) => {
      const on = p >= c[1] && p < c[1] + 0.18;
      if (alerts[i]) alerts[i].classList.toggle("on", p >= c[1] && p < c[1] + 0.24);
      if (rings[i]) rings[i].setAttribute("opacity", on ? "1" : "0");
      if (on) target = TABLES[c[0] as number];
      if (p >= c[1] + 0.18) done++;
    });

    if (wt) {
      const t = target ?? TABLES[0];
      const tx = target ? (t[0] < 300 ? t[0] + 36 : t[0] - 36) : 60;
      const ty = target ? t[1] : 210;
      wt.style.transform = `translate(${tx}px,${ty}px)`;
    }
    const f2 = el.querySelector<HTMLElement>("#f2");
    if (f2) f2.textContent = String(done);
  }

  function updateWaste(el: HTMLElement, p: number) {
    const k = clamp(p / 0.85);
    const rows = el.querySelectorAll<HTMLElement>(".waste-row");
    rows.forEach((row, i) => {
      const w = WASTE_ITEMS[i][2] * (1 - 0.6 * k);
      const wBar = row.querySelector<HTMLElement>(".wasted");
      if (wBar) wBar.style.width = w + "%";
      const label = row.querySelector<HTMLElement>(".waste-pct");
      if (label) label.textContent = w.toFixed(0) + "% waste";
    });
    const wp = el.querySelector<HTMLElement>("#wp");
    if (wp) wp.textContent = "−" + Math.round(38 * k) + "%";
    const f3 = el.querySelector<HTMLElement>("#f3");
    if (f3) f3.textContent = "₹" + Math.round(4200 - 1600 * k).toLocaleString("en-IN");
  }

  useEffect(() => {
    window.addEventListener("scroll", updateChapters, { passive: true });
    window.addEventListener("resize", updateChapters);
    updateChapters();
    return () => {
      window.removeEventListener("scroll", updateChapters);
      window.removeEventListener("resize", updateChapters);
    };
  }, [updateChapters]);

  // ── Build floor SVG ──
  const floorSVG = `<rect x="6" y="6" width="628" height="408" rx="22" fill="none" stroke="#f4ecdd22"/>
    <rect x="6" y="160" width="40" height="100" fill="#ffffff10"/>
    <text x="14" y="215" font-size="11" fill="#A09684" font-family="sans-serif">Kitchen</text>
    ${TABLES.map((t, i) => `<g>
      <circle cx="${t[0]}" cy="${t[1]}" r="30" fill="#1d1710" stroke="#f4ecdd33"/>
      <text x="${t[0]}" y="${t[1]+5}" text-anchor="middle" font-size="14" font-weight="800" fill="#F4ECDD" font-family="sans-serif">T${i+1}</text>
      <circle data-ring="${i}" cx="${t[0]}" cy="${t[1]}" r="30" fill="none" stroke="var(--b)" stroke-width="3" opacity="0" class="table-ring"/>
    </g>`).join("")}
    <g class="waiter-dot" id="wt" style="transform:translate(60px,210px)">
      <circle r="14" fill="var(--b)"/>
      <circle r="5" fill="#1b1206"/>
    </g>`;

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
              <div>Orders per minute<span id="f0">0</span></div>
              <div>Average accept time<span>4 sec</span></div>
            </div>
            <div className="chap-prog"><span className="chap-prog-bar" /></div>
          </div>
          {/* Right viz */}
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Live orders</span>
              <span>Tonight</span>
            </div>
            <div className="order-list">
              {ORDERS.map((o, i) => (
                <div className="order-row" key={i}>
                  <b>{o[0]}</b>
                  <div>{o[1]}<small>Sent to kitchen</small></div>
                  <u>₹{o[2]}</u>
                  <span className="order-status">New</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Revenue so far</span>
              <b id="rev">₹0</b>
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
              <div>Late tickets caught<span id="f1">0</span></div>
            </div>
            <div className="chap-prog"><span className="chap-prog-bar" /></div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Kitchen display</span>
              <span id="kt">0 active</span>
            </div>
            <div className="kds-board">
              <div className="kds-col" ref={el => { if (el) kdsColsRef.current[0] = el; }}><small>New</small></div>
              <div className="kds-col" ref={el => { if (el) kdsColsRef.current[1] = el; }}><small>Cooking</small></div>
              <div className="kds-col" ref={el => { if (el) kdsColsRef.current[2] = el; }}><small>At the pass</small></div>
            </div>
            {/* Pre-create ticket DOM nodes via ref callback */}
            {KDS_ITEMS.map((_, i) => (
              <div
                key={i}
                className="kds-ticket"
                style={{ display: "none" }}
                ref={el => { if (el) kdsTickets.current[i] = el; }}
              />
            ))}
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
              <div>Requests answered<span id="f2">0</span></div>
            </div>
            <div className="chap-prog"><span className="chap-prog-bar" /></div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Floor view</span>
              <span>Waiter: Ananya</span>
            </div>
            <div className="floor-wrap">
              <svg viewBox="0 0 640 420" id="floor" dangerouslySetInnerHTML={{ __html: floorSVG }} />
              <div className="alert-stack">
                {CALLS.map((c, i) => (
                  <div className="alert-card" key={i}>
                    <small>Table {(c[0] as number) + 1}</small>
                    {c[2]}
                  </div>
                ))}
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
              <div>Waste logged<span id="f3">₹0</span></div>
              <div>Supplier order<span>Auto-drafted</span></div>
            </div>
            <div className="chap-prog"><span className="chap-prog-bar" /></div>
          </div>
          <div className="chap-viz">
            <div className="viz-header">
              <span><span className="viz-dot"/>Stock and waste</span>
              <span>This week</span>
            </div>
            <div className="waste-list">
              {WASTE_ITEMS.map((w, i) => (
                <div className="waste-row" key={i}>
                  <span style={{ color: "var(--ink)", textAlign: "left" }}>{w[0]}</span>
                  <div className="waste-bar">
                    <span className="used" style={{ width: w[1] + "%" }} />
                    <span className="wasted" style={{ width: w[2] + "%" }} />
                  </div>
                  <span className="waste-pct">{w[2]}% waste</span>
                </div>
              ))}
            </div>
            <div className="waste-total">
              <span>Wastage vs last month</span>
              <b id="wp">0%</b>
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
          {THEMES.map((t, i) => (
            <button
              key={t.key}
              className="theme-btn"
              aria-pressed={currentTheme === t.key || (!currentTheme && i === 0) ? "true" : "false"}
              onClick={() => {
                if (t.key) {
                  document.documentElement.dataset.theme = t.key;
                } else {
                  delete document.documentElement.dataset.theme;
                }
                setTheme?.(t.key as any);
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
