"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import {
  useGetKitchenQueueQuery,
  useUpdateKitchenStatusMutation,
} from "@/store/api/kitchenApi";
import { OrderState } from "@/types/enums";
import { useAppSelector } from "@/store";
import { wsClient } from "@/lib/ws";
import { playKitchenChime } from "@/lib/audio";
import "../kitchen.css";

interface KitchenTicket {
  id: number | string;
  rawId?: string;
  tb: string;
  car?: string;
  guest: string;
  pax: number;
  t: number;
  rt?: number;
  st?: number;
  s: "new" | "cook" | "ready" | "served";
  items: Array<[string, number, number]>; // [name, qty, checked(0|1)]
  hide?: boolean;
  moving?: boolean;
  kick?: number;
  ph?: number;
  k?: number;
  tx?: number;
  ty?: number;
  cv?: HTMLCanvasElement;
  tex?: THREE.CanvasTexture;
  mesh?: THREE.Mesh;
}

const LW = 300;
const RS = 2;
const m = 60000;
const COL: Record<string, string> = {
  new: "#E9B24C",
  cook: "#6FB1D6",
  ready: "#6CC48F",
};
const ST: Array<[string, string, string, "new" | "cook" | "ready" | "served"]> = [
  ["new", "New", "Start cooking", "cook"],
  ["cook", "Cooking", "Mark ready", "ready"],
  ["ready", "Ready for pickup", "Handed over", "served"],
];

const INK = "#1B1409";
const MUTE = "#7A6C55";

export default function KitchenQueuePage() {
  const router = useRouter();
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);
  const { data: queueOrders, refetch } = useGetKitchenQueueQuery();
  const [updateKitchenStatus] = useUpdateKitchenStatusMutation();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const sumRef = useRef<HTMLSpanElement | null>(null);
  const hnRef = useRef<HTMLElement | null>(null);
  const segRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const srRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const errRef = useRef<HTMLDivElement | null>(null);

  // Keep references to active state and handlers
  const ordersRef = useRef<KitchenTicket[]>([]);
  const tabRef = useRef<string>("new");
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);
  const grpRef = useRef<THREE.Group | null>(null);
  const embRef = useRef<THREE.Points | null>(null);
  const shadowTexRef = useRef<THREE.CanvasTexture | null>(null);
  const laneObjsRef = useRef<THREE.Mesh[]>([]);
  const hovRef = useRef<KitchenTicket | null>(null);
  const hrowRef = useRef<number>(-1);
  const mousePosRef = useRef<{ mx: number; my: number; sy: number }>({
    mx: 0,
    my: 0,
    sy: 0,
  });

  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((text: string) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = text;
    el.classList.add("on");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      el.classList.remove("on");
    }, 2000);
  }, []);

  // Real-time kitchen WebSocket subscription & audible chime
  useEffect(() => {
    wsClient.connect();

    const unsubOrderPlaced = wsClient.on("ORDER_PLACED", () => {
      playKitchenChime();
      showToast("🛎️ New order placed!");
      refetch();
    });

    const unsubOrderAccepted = wsClient.on("ORDER_ACCEPTED", () => {
      playKitchenChime();
      showToast("🛎️ Order confirmed for kitchen!");
      refetch();
    });

    const unsubOrderStatus = wsClient.on("ORDER_STATUS_CHANGED", () => {
      refetch();
    });

    const unsubOrderCancelled = wsClient.on("ORDER_CANCELLED", () => {
      showToast("⚠️ Order cancelled");
      refetch();
    });

    return () => {
      unsubOrderPlaced();
      unsubOrderAccepted();
      unsubOrderStatus();
      unsubOrderCancelled();
    };
  }, [refetch, showToast]);

  // Format helpers matching the HTML
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return s < 60 ? s + "s" : Math.floor(s / 60) + " min";
  };

  const lvl = (a: number, r: boolean) => {
    a /= m;
    const k = r ? [2, 4] : [8, 15];
    return a < k[0] ? "" : a < k[1] ? "warn" : "late";
  };

  const ts = (o: KitchenTicket) => (o.s === "ready" ? o.rt || o.t : o.t);

  const rr = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  const wrap = (c: CanvasRenderingContext2D, t: string, w: number) => {
    let a: string[] = [];
    let l = "";
    t.split(" ").forEach((x) => {
      const n = l ? l + " " + x : x;
      if (c.measureText(n).width > w && l) {
        a.push(l);
        l = x;
      } else l = n;
    });
    a.push(l);
    return a.slice(0, 2);
  };

  const met = (o: KitchenTicket) => {
    const iy = 14 + 112 + 40 + 8;
    const rh = 62;
    const ay = iy + o.items.length * rh + 12;
    return { iy, rh, ay, ah: 58, LH: ay + 58 + 14 + 14 };
  };

  const draw = useCallback((o: KitchenTicket) => {
    if (!o.cv || !o.tex) return;
    const M = met(o);
    const c = o.cv.getContext("2d");
    if (!c) return;

    const r = o.s === "ready";
    const a = Date.now() - ts(o);
    const l = lvl(a, r);
    const hv = hovRef.current === o;
    const hrow = hrowRef.current;
    const n = o.items.reduce((x, i) => x + i[1], 0);

    c.setTransform(RS, 0, 0, RS, 0, 0);
    c.clearRect(0, 0, LW, M.LH);
    c.textAlign = "left";

    // Ticket contour with serrated bottom edge
    c.beginPath();
    c.moveTo(0, 10);
    c.arcTo(0, 0, 10, 0, 10);
    c.lineTo(LW - 10, 0);
    c.arcTo(LW, 0, LW, 10, 10);
    c.lineTo(LW, M.LH - 12);
    for (let i = 0; i < 25; i++) {
      c.lineTo(LW - 12 * i - 6, M.LH);
      c.lineTo(LW - 12 * (i + 1), M.LH - 12);
    }
    c.closePath();

    c.fillStyle = "#FBF6EA";
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = l === "late" ? "#C0392B" : COL[o.s] || COL.new;
    c.fillRect(0, 0, LW, 14);
    c.restore();

    // Table / Destination
    c.fillStyle = INK;
    c.font = '400 58px "Instrument Serif", Georgia, serif';
    c.fillText(o.tb, 20, 76);

    // Guest Name
    c.font = '800 22px "Hanken Grotesk", sans-serif';
    c.fillText(o.guest.slice(0, 18), 22, 102);
    c.fillStyle = MUTE;
    c.font = '500 14px "Hanken Grotesk", sans-serif';
    c.fillText(
      `${o.pax} guests · ${n} ${n === 1 ? "item" : "items"} · #${o.id}`,
      22,
      121
    );

    // Time pill
    const tt = (l === "late" ? "LATE · " : "") + fmt(a);
    c.font = '800 15px "Hanken Grotesk", sans-serif';
    const pw = c.measureText(tt).width + 26;
    rr(c, LW - 18 - pw, 26, pw, 30, 15);
    c.fillStyle = l === "late" ? "#C0392B" : l === "warn" ? "#E9B24C" : "#E3D8BF";
    c.fill();
    c.fillStyle = l === "late" ? "#fff" : INK;
    c.fillText(tt, LW - 18 - pw + 13, 46);

    // Vehicle / Dine-in pill
    const cr = !!o.car;
    rr(c, 20, 134, LW - 40, 28, 14);
    if (cr) {
      c.fillStyle = INK;
      c.fill();
      c.fillStyle = "#FBF6EA";
    } else {
      c.strokeStyle = "#1B140966";
      c.lineWidth = 1.5;
      c.stroke();
      c.fillStyle = MUTE;
    }
    c.font = '700 13px "Hanken Grotesk", sans-serif';
    let ct = cr ? "CAR · " + o.car : "DINE-IN";
    while (c.measureText(ct).width > LW - 64) ct = ct.slice(0, -2);
    c.fillText(ct, 32, 152);

    // Dishes list
    o.items.forEach((it, i) => {
      const y = M.iy + i * M.rh;
      // When order is in ready or served stage, all items are done with a line across
      const d = o.s === "ready" || o.s === "served" ? 1 : it[2];
      c.setLineDash([4, 4]);
      c.strokeStyle = "#1B140933";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(18, y);
      c.lineTo(LW - 18, y);
      c.stroke();
      c.setLineDash([]);

      if (hv && hrow === i && o.s === "cook") {
        rr(c, 8, y + 3, LW - 16, 56, 12);
        c.fillStyle = "#1B140912";
        c.fill();
      }

      // Quantity circle / square
      rr(c, 20, y + 8, 46, 46, 13);
      if (it[1] > 1) {
        c.fillStyle = d ? "#1B140977" : INK;
        c.fill();
        c.fillStyle = "#FBF6EA";
      } else {
        c.strokeStyle = d ? "#1B140955" : INK;
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = d ? MUTE : INK;
      }
      c.textAlign = "center";
      c.font = '400 38px "Instrument Serif", Georgia, serif';
      c.fillText(String(it[1]), 43, y + 43);
      c.textAlign = "left";

      // Dish name with strikethrough line when done
      c.font = '700 19px "Hanken Grotesk", sans-serif';
      c.fillStyle = d ? MUTE : INK;
      const L = wrap(c, it[0], LW - 78 - 54);
      L.forEach((t, k) => {
        const ly = L.length > 1 ? y + 28 + k * 22 : y + 37;
        c.fillText(t, 78, ly);
        if (d) {
          // Strikethrough line stating it's done
          c.fillRect(78, ly - 6, c.measureText(t).width, 2.5);
        }
      });

      // Checkbox circle
      c.beginPath();
      c.arc(LW - 36, y + 31, 13, 0, 7);
      if (d) {
        c.fillStyle = "#2F8F5B";
        c.fill();
        c.strokeStyle = "#fff";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(LW - 42, y + 31);
        c.lineTo(LW - 37, y + 36);
        c.lineTo(LW - 29, y + 26);
        c.stroke();
      } else {
        c.strokeStyle = o.s === "cook" ? "#1B140077" : "#1B140030";
        c.lineWidth = 2;
        c.stroke();
      }
    });

    c.setLineDash([4, 4]);
    c.strokeStyle = "#1B140933";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(18, M.ay - 6);
    c.lineTo(LW - 18, M.ay - 6);
    c.stroke();
    c.setLineDash([]);

    // Action button or status indicator
    if (o.s === "cook") {
      const dn = o.items.filter((i) => i[2]).length;
      const B = () => rr(c, 16, M.ay, LW - 32, M.ah, 16);
      B();
      c.fillStyle = "#1B14090F";
      c.fill();
      c.save();
      B();
      c.clip();
      c.fillStyle = "#6FB1D6";
      c.globalAlpha = 0.6;
      c.fillRect(16, M.ay, ((LW - 32) * dn) / o.items.length, M.ah);
      c.restore();
      B();
      c.strokeStyle = "#1B140040";
      c.lineWidth = 1.5;
      c.stroke();
      c.fillStyle = INK;
      c.textAlign = "center";
      c.font = '800 17px "Hanken Grotesk", sans-serif';
      c.fillText(
        dn + " of " + o.items.length + " dishes done",
        LW / 2,
        M.ay + 35
      );
    } else if (o.s === "ready") {
      // Waiting for pickup indicator - NO button for operator to click, just informational banner
      rr(c, 16, M.ay, LW - 32, M.ah, 16);
      c.fillStyle = "#1b14090d";
      c.fill();
      c.strokeStyle = "#1b14092b";
      c.lineWidth = 1.5;
      c.stroke();
      c.fillStyle = MUTE;
      c.textAlign = "center";
      c.font = '700 17px "Hanken Grotesk", sans-serif';
      c.fillText(cr ? "Waiting for car pickup" : "Waiting for pickup", LW / 2, M.ay + 35);
    } else {
      // Clickable Start Cooking button for new tickets
      rr(c, 16, M.ay, LW - 32, M.ah, 16);
      c.fillStyle = hv && hrow === -2 ? "#4A3815" : INK;
      c.fill();
      c.fillStyle = "#FBF6EA";
      c.textAlign = "center";
      c.font = '800 19px "Hanken Grotesk", sans-serif';
      c.fillText("Start cooking", LW / 2, M.ay + 36);
    }

    c.textAlign = "left";
    o.tex.needsUpdate = true;
  }, []);

  const mk = useCallback((o: KitchenTicket) => {
    const grp = grpRef.current;
    const SH = shadowTexRef.current;
    if (!grp || !SH) return;

    const M = met(o);
    o.cv = document.createElement("canvas");
    o.cv.width = LW * RS;
    o.cv.height = M.LH * RS;
    o.tex = new THREE.CanvasTexture(o.cv);
    o.tex.anisotropy = 4;

    const me = new THREE.Mesh(
      new THREE.PlaneGeometry(LW, M.LH),
      new THREE.MeshBasicMaterial({ map: o.tex, transparent: true })
    );
    me.userData.o = o;

    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(LW + 70, M.LH + 70),
      new THREE.MeshBasicMaterial({
        map: SH,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
    );
    sh.position.set(0, -16, -6);
    me.add(sh);

    o.mesh = me;
    o.ph = Math.random() * 6;
    o.kick = 0;
    me.scale.setScalar(0.01);
    const H = window.innerHeight;
    me.position.set(0, -H, 0);
    o.tx = 0;
    o.ty = -H;

    draw(o);
    if (!o.hide) grp.add(me);
  }, [draw]);

  const laneHead = (s: [string, string, string, string], n: number, lw: number) => {
    const c = document.createElement("canvas");
    c.width = lw * 2;
    c.height = 120;
    const x = c.getContext("2d")!;
    x.scale(2, 2);
    x.fillStyle = COL[s[0]] || COL.new;
    x.beginPath();
    x.arc(20, 30, 6, 0, 7);
    x.fill();
    x.fillStyle = "#1B1409";
    x.font = '400 34px "Instrument Serif", Georgia, serif';
    x.fillText(s[1], 36, 42);
    const w = x.measureText(s[1]).width;
    rr(x, 36 + w + 12, 18, 34, 26, 13);
    x.fillStyle = "#1b140914";
    x.fill();
    x.fillStyle = "#6F6350";
    x.textAlign = "center";
    x.font = '800 14px "Hanken Grotesk", sans-serif';
    x.fillText(String(n), 36 + w + 29, 36);
    return c;
  };

  const layout = useCallback(() => {
    const R = rendererRef.current;
    const cam = camRef.current;
    const grp = grpRef.current;
    const topEl = topRef.current;
    const spEl = spacerRef.current;
    if (!R || !cam || !grp || !topEl || !spEl) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const nw = W < 860;
    const top = topEl.offsetHeight + 10;
    const tab = tabRef.current;
    const Ls = nw ? [ST.find((s) => s[0] === tab) || ST[0]] : ST;
    const n = Ls.length;
    const pad = nw ? 14 : 22;
    const gap = 20;
    const lw = (W - 2 * pad - gap * (n - 1)) / n;
    const tw = Math.min(lw - (nw ? 24 : 28), 380);
    const k = tw / LW;

    // Dispose old lane background/headers
    laneObjsRef.current.forEach((x) => {
      grp.remove(x);
      x.geometry.dispose();
      if ((x.material as any).map) (x.material as any).map.dispose();
      (x.material as any).dispose();
    });
    laneObjsRef.current = [];

    let bot = top;
    const place: Array<[[string, string, string, string], number, number, number]> = [];
    const O = ordersRef.current;

    Ls.forEach((s, i) => {
      const lx = pad + i * (lw + gap);
      const cx = lx + lw / 2 - W / 2;
      let y = top + 70;
      O.filter((o) => o.s === s[0])
        .sort((a, b) => ts(a) - ts(b))
        .forEach((o) => {
          const th = met(o).LH * k;
          o.tx = cx;
          o.ty = H / 2 - (y + th / 2);
          o.k = k;
          y += th + 18;
        });
      bot = Math.max(bot, y);
      place.push([s as [string, string, string, string], lx, cx, O.filter((o) => o.s === s[0]).length]);
    });

    const total = bot + 30;
    const ph = Math.max(total - top - 20, H - top - 20);

    place.forEach((p) => {
      const [s, lx, cx, cnt] = p;
      const b = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, ph),
        new THREE.MeshBasicMaterial({
          color: 0x1b1409,
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        })
      );
      b.position.set(cx, H / 2 - (top + ph / 2), -30);

      const e = new THREE.Mesh(
        new THREE.PlaneGeometry(lw + 2, ph + 2),
        new THREE.MeshBasicMaterial({
          color: 0x1b1409,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        })
      );
      e.position.set(cx, b.position.y, -31);

      const hd = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, 60),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(laneHead(s, cnt, lw)),
          transparent: true,
          depthWrite: false,
        })
      );
      hd.position.set(cx, H / 2 - (top + 30), -10);

      [e, b, hd].forEach((x) => {
        grp.add(x);
        laneObjsRef.current.push(x);
      });
    });

    O.forEach((o) => {
      o.hide = !Ls.some((s) => s[0] === o.s);
      if (!o.hide && o.mesh && !o.mesh.parent) grp.add(o.mesh);
    });

    spEl.style.height = total + "px";
    cam.aspect = W / H;
    cam.position.z = H / 2 / Math.tan((20 * Math.PI) / 180);
    cam.updateProjectionMatrix();
    R.setSize(W, H, false);
  }, []);

  const updateUI = useCallback(() => {
    const O = ordersRef.current;
    const L = O.filter((o) => o.s !== "served");
    const late = L.filter(
      (o) => lvl(Date.now() - ts(o), o.s === "ready") === "late"
    ).length;
    const H2 = O.filter((o) => o.s === "served").sort(
      (a, b) => (b.st || 0) - (a.st || 0)
    );

    if (sumRef.current) {
      sumRef.current.innerHTML = `<b>${L.length}</b> in kitchen${
        late ? ` · <span class="l"><b>${late}</b> late</span>` : ""
      }`;
    }
    if (hnRef.current) {
      hnRef.current.textContent = String(H2.length);
    }
    if (segRef.current) {
      const tab = tabRef.current;
      segRef.current.innerHTML = ST.map(
        (s) =>
          `<button data-a="tab" data-v="${s[0]}" aria-pressed="${
            tab === s[0]
          }">${s[1].split(" ")[0]} ${
            O.filter((o) => o.s === s[0]).length
          }</button>`
      ).join("");
    }
    if (drawerRef.current) {
      drawerRef.current.innerHTML =
        "<h3>Served today</h3>" +
        (H2.map(
          (o) =>
            `<div class="hr"><i>${o.tb}</i><div><b>${
              o.guest
            }</b><small>${o.items
              .map((i) => i[1] + "× " + i[0])
              .join(", ")}</small></div><small style="flex:none">${fmt(
              Date.now() - (o.st || Date.now())
            )} ago</small><button data-a="rec" data-o="${
              o.id
            }">Recall</button></div>`
        ).join("") || '<div class="em">Nothing served yet.</div>');
    }
    if (srRef.current) {
      srRef.current.innerHTML = L.map(
        (o) =>
          `<button data-a="${o.s === "cook" ? "next" : "adv"}" data-o="${
            o.id
          }">${o.tb} ${o.guest}: ${
            o.s === "cook"
              ? "tick next dish"
              : o.s === "ready"
              ? "picked up"
              : (ST.find((s) => s[0] === o.s) || ST[0])[2]
          }</button>`
      ).join("");
    }
  }, []);

  const advance = useCallback(
    async (o: KitchenTicket) => {
      const s = ST.find((x) => x[0] === o.s);
      if (!s) return;
      const nextStatus = s[3];
      o.s = nextStatus;
      if (o.s === "ready") o.rt = Date.now();
      if (o.s === "served") o.st = Date.now();
      // If moving to ready or served, all items done
      o.items.forEach((i) => (i[2] = nextStatus === "ready" || nextStatus === "served" ? 1 : 0));
      o.kick = 0.14;

      showToast(
        o.s === "cook"
          ? o.tb + " · cooking started"
          : o.s === "ready"
          ? o.tb + " · ready, waiting for pickup"
          : o.tb + " · picked up"
      );

      layout();
      draw(o);
      updateUI();

      // If tied to live backend order, synchronize
      if (o.rawId) {
        const orderStateMap: Record<string, OrderState> = {
          cook: OrderState.PREPARING,
          ready: OrderState.READY,
          served: OrderState.SERVED,
        };
        const stEnum = orderStateMap[nextStatus];
        if (stEnum) {
          try {
            await updateKitchenStatus({
              orderId: o.rawId,
              data: { status: stEnum },
            }).unwrap();
            refetch();
          } catch (e) {
            console.error("Backend status update error:", e);
          }
        }
      }
    },
    [draw, layout, refetch, showToast, updateKitchenStatus, updateUI]
  );

  const tick = useCallback(
    (o: KitchenTicket, i: number) => {
      if (o.s !== "cook" || o.moving) return;
      o.items[i][2] ^= 1;
      draw(o);
      if (o.items.every((x) => x[2])) {
        o.moving = true;
        setTimeout(() => {
          o.moving = false;
          advance(o);
        }, 550);
      }
    },
    [advance, draw]
  );

  const act = useCallback(
    (o: KitchenTicket) => {
      // In ready stage, no clickable button for the operator
      if (o.moving || o.s === "cook" || o.s === "ready") return;
      advance(o);
    },
    [advance]
  );

  const pick = useCallback((e: MouseEvent | PointerEvent) => {
    const R = rendererRef.current;
    const cam = camRef.current;
    if (!R || !cam) return null;

    const r = R.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    ray.setFromCamera(mouse, cam);

    const activeMeshes = ordersRef.current
      .filter((o) => o.mesh && o.mesh.parent && !o.hide)
      .map((o) => o.mesh!);
    const h = ray.intersectObjects(activeMeshes, false);
    if (!h.length || !h[0].uv) return null;

    const o = (h[0].object as any).userData.o as KitchenTicket;
    const M = met(o);
    const ly = (1 - h[0].uv.y) * M.LH;
    let row = -1;
    if (ly >= M.iy && ly < M.ay - 6) {
      row = Math.min(o.items.length - 1, Math.floor((ly - M.iy) / M.rh));
    } else if (ly >= M.ay && ly <= M.ay + M.ah) {
      // Only clickable for "new" tickets ("Start cooking")
      if (o.s === "new") {
        row = -2;
      }
    }
    return { o, row };
  }, []);

  // Initialize Three.js scene & board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let clockInterval: any;

    try {
      const R = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      rendererRef.current = R;
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const cam = new THREE.PerspectiveCamera(40, 1, 1, 5000);
      camRef.current = cam;

      const root = new THREE.Group();
      rootRef.current = root;
      const grp = new THREE.Group();
      grpRef.current = grp;
      root.add(grp);
      scene.add(root);

      // Create drop shadow texture
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d")!;
      x.shadowColor = "#000";
      x.shadowBlur = 22;
      x.fillStyle = "#000";
      rr(x, 36, 36, 56, 56, 6);
      x.fill();
      const SH = new THREE.CanvasTexture(c);
      shadowTexRef.current = SH;

      // Warm ambient ember particles in 3D
      const N = 70;
      const pa = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pa[i * 3] = (Math.random() - 0.5) * window.innerWidth * 1.2;
        pa[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight * 2;
        pa[i * 3 + 2] = -200 - Math.random() * 200;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pa, 3));
      const emb = new THREE.Points(
        g,
        new THREE.PointsMaterial({
          color: 0x8a7a5a,
          size: 4,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
        })
      );
      embRef.current = emb;
      scene.add(emb);

      // Start with clean empty orders - strictly live backend data, no dummy/mock data
      ordersRef.current = [];
      layout();
      updateUI();

      // Render loop
      const loop = (t: number) => {
        animId = requestAnimationFrame(loop);
        const s = t / 1000;
        const H = window.innerHeight;
        const currentOrders = ordersRef.current;
        const currentHov = hovRef.current;
        const mp = mousePosRef.current;

        currentOrders.forEach((o) => {
          if (!o.mesh) return;
          const me = o.mesh;
          const tg = o.hide ? 0.001 : (o.k || 1) * (currentHov === o ? 1.03 : 1);
          me.position.x += ((o.tx ?? 0) - me.position.x) * 0.14;
          me.position.y += ((o.ty ?? -H) - me.position.y) * 0.14;
          me.position.z +=
            ((currentHov === o ? 40 : 0) - me.position.z) * 0.15;
          me.scale.setScalar(me.scale.x + (tg - me.scale.x) * 0.15);
          me.rotation.z +=
            (((o.kick || 0) + Math.sin(s * 0.9 + (o.ph || 0)) * 0.005) -
              me.rotation.z) *
            0.12;
          o.kick = (o.kick || 0) * 0.92;
          me.rotation.x +=
            ((currentHov === o ? -0.05 : 0) - me.rotation.x) * 0.12;
          if (o.hide && me.scale.x < 0.03 && me.parent && grpRef.current) {
            grpRef.current.remove(me);
          }
        });

        if (grpRef.current) {
          grpRef.current.position.y +=
            (mp.sy - grpRef.current.position.y) * 0.25;
        }
        if (rootRef.current) {
          rootRef.current.rotation.y +=
            (mp.mx * 0.05 - rootRef.current.rotation.y) * 0.06;
          rootRef.current.rotation.x +=
            (-mp.my * 0.035 - rootRef.current.rotation.x) * 0.06;
        }

        if (embRef.current) {
          const p = embRef.current.geometry.attributes
            .position as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            let y = p.getY(i) + 0.25 + (i % 5) * 0.07;
            if (y > H) y = -H;
            p.setY(i, y);
          }
          p.needsUpdate = true;
        }

        if (rendererRef.current && sceneRef.current && camRef.current) {
          rendererRef.current.render(sceneRef.current, camRef.current);
        }
      };

      requestAnimationFrame(loop);

      // DOM event handlers
      const cv = R.domElement;

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const p = pick(e);
        const po = hovRef.current;
        const pr = hrowRef.current;
        hovRef.current = p ? p.o : null;
        hrowRef.current = p ? p.row : -1;
        cv.style.cursor =
          p &&
          ((p.row >= 0 && p.o.s === "cook") ||
            (p.row === -2 && p.o.s === "new"))
            ? "pointer"
            : "default";
        if (po !== hovRef.current || pr !== hrowRef.current) {
          if (po) draw(po);
          if (hovRef.current) draw(hovRef.current);
        }
      };

      const onPointerLeave = () => {
        const po = hovRef.current;
        hovRef.current = null;
        hrowRef.current = -1;
        if (po) draw(po);
      };

      const onClick = (e: MouseEvent) => {
        const p = pick(e);
        if (!p) return;
        if (p.o.moving) return;
        if (p.row >= 0) tick(p.o, p.row);
        else if (p.row === -2) act(p.o);
      };

      const onWindowPointerMove = (e: PointerEvent) => {
        mousePosRef.current.mx = e.clientX / window.innerWidth - 0.5;
        mousePosRef.current.my = e.clientY / window.innerHeight - 0.5;
      };

      const onScroll = () => {
        mousePosRef.current.sy = window.scrollY;
      };

      const onResize = () => {
        layout();
      };

      cv.addEventListener("pointermove", onPointerMove);
      cv.addEventListener("pointerleave", onPointerLeave);
      cv.addEventListener("click", onClick);
      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);

      // Re-draw times every second
      clockInterval = setInterval(() => {
        ordersRef.current.forEach((o) => !o.hide && draw(o));
        updateUI();
      }, 1000);

      return () => {
        cancelAnimationFrame(animId);
        clearInterval(clockInterval);
        cv.removeEventListener("pointermove", onPointerMove);
        cv.removeEventListener("pointerleave", onPointerLeave);
        cv.removeEventListener("click", onClick);
        window.removeEventListener("pointermove", onWindowPointerMove);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        R.dispose();
      };
    } catch (e) {
      console.error("WebGL error:", e);
      if (errRef.current) errRef.current.style.display = "grid";
    }
  }, [act, draw, layout, mk, pick, tick, updateUI]);

  // Synchronize live backend queue orders
  useEffect(() => {
    if (!queueOrders) return;

    const existing = ordersRef.current;
    let changed = false;

    const stMap: Record<string, "new" | "cook" | "ready" | "served"> = {
      ACCEPTED: "new",
      PLACED_VERIFIED: "new",
      PREPARING: "cook",
      READY: "ready",
      SERVED: "served",
    };

    // Remove tickets no longer in live backend queue
    const currentBackendIds = new Set(queueOrders.map((q) => q.id));
    for (let i = existing.length - 1; i >= 0; i--) {
      const ticket = existing[i];
      if (ticket.rawId && !currentBackendIds.has(ticket.rawId)) {
        if (ticket.mesh && grpRef.current) {
          grpRef.current.remove(ticket.mesh);
        }
        existing.splice(i, 1);
        changed = true;
      }
    }

    queueOrders.forEach((qo) => {
      const targetStatus = stMap[qo.status] || "new";
      const isReady = targetStatus === "ready" || targetStatus === "served";
      const already = existing.find(
        (e) => e.rawId === qo.id || String(e.id) === String(qo.id)
      );

      if (already) {
        if (already.s !== targetStatus) {
          already.s = targetStatus;
          already.hide = targetStatus === "served";
          if (isReady) {
            already.items.forEach((it) => (it[2] = 1));
          }
          draw(already);
          changed = true;
        }
      } else {
        const newTicket: KitchenTicket = {
          id: qo.sequence_number || (qo.id ? qo.id.slice(-4) : "1"),
          rawId: qo.id,
          tb: qo.table_number ? `T${qo.table_number}` : qo.vehicle_number ? "C1" : "T1",
          car: qo.vehicle_number ? `Car · ${qo.vehicle_number}` : undefined,
          guest: qo.customer_name || "Guest Diner",
          pax: qo.guest_count || 2,
          t: qo.placed_at ? new Date(qo.placed_at).getTime() : Date.now(),
          s: targetStatus,
          items: (qo.items || []).map((it) => [
            it.item_name_snapshot,
            it.quantity,
            isReady ? 1 : 0,
          ]),
          hide: targetStatus === "served",
        };
        existing.unshift(newTicket);
        mk(newTicket);
        changed = true;
      }
    });

    if (changed || existing.length === 0) {
      layout();
      updateUI();
    }
  }, [queueOrders, draw, layout, mk, updateUI]);

  // Document click handler for UI buttons
  const handleActionClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const b = target.closest("[data-a]") as HTMLElement | null;
    if (!b) return;

    const a = b.dataset.a;
    const oId = b.dataset.o;
    const o = ordersRef.current.find((x) => String(x.id) === String(oId));

    if (a === "tab") {
      const v = b.dataset.v;
      if (v) {
        tabRef.current = v;
        layout();
        updateUI();
      }
    } else if (a === "adv") {
      if (o) act(o);
    } else if (a === "next") {
      if (o) {
        const i = o.items.findIndex((x) => !x[2]);
        if (i >= 0) tick(o, i);
      }
    } else if (a === "rec") {
      if (o) {
        o.s = "cook";
        o.hide = false;
        o.kick = -0.1;
        showToast(o.tb + " moved back to cooking");
        layout();
        draw(o);
        updateUI();
        if (o.rawId) {
          updateKitchenStatus({
            orderId: o.rawId,
            data: { status: OrderState.PREPARING },
          }).catch(console.error);
        }
      }
    } else if (a === "dr") {
      if (drawerRef.current) {
        drawerRef.current.hidden = !drawerRef.current.hidden;
      }
    } else if (a === "waiter") {
      showToast("Opening waiter view…");
      setTimeout(() => {
        router.push("/staff/orders");
      }, 500);
    }
  };

  return (
    <div className="kitchen-screen" onClick={handleActionClick}>
      {/* 3D WebGL Canvas */}
      <canvas id="gl" ref={canvasRef} aria-label="Kitchen ticket board" />

      {/* Fallback error if WebGL disabled */}
      <div id="err" ref={errRef}>
        This board needs WebGL, which this browser has turned off.
      </div>

      {/* Floating Kitchen Header */}
      <header id="top" ref={topRef}>
        <div className="row">
          <div>
            <h1>Kitchen</h1>
            <p id="hint" ref={hintRef}>
              Start cooking to unlock the dishes · tick every dish and the ticket moves to pickup
            </p>
          </div>
          <div className="sp" />
          <span id="sum" ref={sumRef} />
          <button className="pl" data-a="dr" type="button">
            Served today <b id="hn" ref={hnRef}>0</b>
          </button>
          <button className="pl" data-a="waiter" type="button">
            Waiter view
          </button>
        </div>
        <div id="seg" ref={segRef} />
      </header>

      {/* Served Today Drawer */}
      <aside id="dr" ref={drawerRef} hidden />

      {/* Dynamic Scroll Spacer */}
      <div id="sp" ref={spacerRef} />

      {/* Accessibility Screen Reader buttons */}
      <div className="sr" id="sr" ref={srRef} />

      {/* Bottom Floating Toast */}
      <div className="toast" id="toast" ref={toastRef} role="status" />
    </div>
  );
}
