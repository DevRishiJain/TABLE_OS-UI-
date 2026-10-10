"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logoutStaff } from "@/store/slices/authSlice";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffRole } from "@/types/enums";
import { LogOut } from "lucide-react";
import { useRestaurantTheme } from "@/components/providers/RestaurantThemeProvider";
import { SubscriptionLockModal } from "@/components/SubscriptionLockModal";
import "./admin.css";

const SVGIcons: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  ord: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6"/>',
  an: '<path d="M3 20h18M6 16V9M11 16V5M16 16v-5M21 16V8"/>',
  ex: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  st: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  mn: '<path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v6M14 3c0 6 4 6 4 10v8"/>',
  tb: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7h-4"/>',
  pp: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6"/>',
  se: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  cf: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  pl: '<path d="M12 5v14M5 12h14"/>',
  ob: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  sb: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M2 10h20"/><path d="M7 15h3"/>',
  pos: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 8h10M7 12h4"/>',
};

function Icon({ name }: { name: string }) {
  const path = SVGIcons[name] || SVGIcons.home;
  return (
    <svg
      viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export default function RestaurantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [quickOpen, setQuickOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { colorMode } = useRestaurantTheme();

  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const userName = useAppSelector((state) => state.auth.userName) || "Vikram Mehta";
  const employeeId = useAppSelector((state) => state.auth.employeeId) || "EMP-ADM-001";
  const userRole = useAppSelector((state) => state.auth.staffRole) || "Admin";

  const handleLogout = () => {
    dispatch(logoutStaff());
    router.push("/login");
  };

  const normalizedRole = (userRole || "").toUpperCase();
  const isOwnerOrAdmin =
    normalizedRole.includes("SUPER") ||
    normalizedRole.includes("FRANCHISE") ||
    normalizedRole.includes("OWNER") ||
    normalizedRole.includes("ADMIN");
  const isFranchiseOrSuper =
    normalizedRole.includes("SUPER") || normalizedRole.includes("FRANCHISE");

  const navGroups = [
    {
      group: "Run service",
      items: [
        { key: "home", label: "Home", href: "/restaurant/dashboard", icon: "home", exact: true },
        { key: "billing", label: "Quick Billing", href: "/restaurant/billing", icon: "pos", exact: true },
        { key: "orders", label: "Orders", href: "/restaurant/orders", icon: "ord", exact: true },
      ],
    },
    {
      group: "Money",
      items: [
        ...(isOwnerOrAdmin
          ? [{ key: "analytics", label: "Profit & Loss", href: "/restaurant/analytics", icon: "an", exact: true }]
          : []),
        { key: "expenses", label: "Expenses", href: "/restaurant/expenses", icon: "ex", exact: true },
        ...(isOwnerOrAdmin
          ? [{ key: "settle", label: "Payouts", href: "/restaurant/settlements", icon: "se", exact: false }]
          : []),
        ...(isOwnerOrAdmin
          ? [{ key: "subscription", label: "Subscription & Billing", href: "/restaurant/subscription", icon: "sb", exact: true }]
          : []),
      ],
    },
    {
      group: "Kitchen",
      items: [
        { key: "inventory", label: "Stock", href: "/restaurant/inventory", icon: "st", exact: true },
        { key: "menu", label: "Menu", href: "/restaurant/menu", icon: "mn", exact: false },
      ],
    },
    {
      group: "Setup",
      items: [
        { key: "tables", label: "Tables & QR", href: "/restaurant/tables", icon: "tb", exact: false },
        { key: "staff", label: "Staff", href: "/restaurant/staff", icon: "pp", exact: false },
        ...(isFranchiseOrSuper
          ? [{ key: "franchise", label: "Franchise Suite", href: "/restaurant/franchise", icon: "ob", exact: true }]
          : []),
        { key: "onboarding", label: "Onboarding", href: "/restaurant/onboarding", icon: "ob", exact: false },
        { key: "settings", label: "Settings", href: "/restaurant/settings", icon: "cf", exact: false },
      ],
    },
  ];

  return (
    <RoleGuard
      allowedRoles={[
        StaffRole.RESTAURANT_ADMIN,
        StaffRole.RESTAURANT_OWNER,
        StaffRole.FRANCHISE_OWNER,
        StaffRole.MANAGER,
        StaffRole.SUPER_ADMIN,
      ]}
      portalName="Restaurant Management & Analytics Hub"
      fallbackRedirect="/login"
    >
      <div className={`admin-screen ${colorMode}`}>
        {/* Desktop Sidebar Navigation */}
        <aside id="nv">
          <Link href="/restaurant/dashboard" className="lg">
            Table<em>OS</em>
          </Link>
          <div className="rs">{restaurantName} · Live</div>

          <button className="btn qa" onClick={() => setQuickOpen(true)}>
            <Icon name="pl" />
            Quick add
          </button>

          {navGroups.map((grp) => (
            <React.Fragment key={grp.group}>
              <div className="gl">{grp.group}</div>
              {grp.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ni ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          ))}

          <div className="me">
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{userName}</b>
              <span style={{ fontSize: "0.78rem", color: "var(--admin-mute)" }}>
                {userRole} · {employeeId}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: "none",
                border: 0,
                color: "var(--admin-mute)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
              }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="bn" id="bn" aria-label="Main">
          <Link
            href="/restaurant/dashboard"
            aria-selected={pathname === "/restaurant/dashboard" ? "true" : undefined}
          >
            <Icon name="home" />
            <span>Home</span>
          </Link>

          <Link
            href="/restaurant/orders"
            aria-selected={pathname === "/restaurant/orders" ? "true" : undefined}
          >
            <Icon name="ord" />
            <span>Orders</span>
          </Link>

          <button
            className="fab"
            aria-label="Quick add"
            onClick={() => setQuickOpen(true)}
          >
            <Icon name="pl" />
          </button>

          <Link
            href="/restaurant/analytics"
            aria-selected={pathname === "/restaurant/analytics" ? "true" : undefined}
          >
            <Icon name="an" />
            <span>Money</span>
          </Link>

          <button
            onClick={() => setMoreOpen(true)}
            aria-selected={moreOpen ? "true" : undefined}
          >
            <Icon name="mn" />
            <span>More</span>
          </button>
        </nav>

        {/* Main Work Area */}
        <main className={pathname === "/restaurant/billing" ? "pos-main" : undefined}>
          <div className={`in ${pathname === "/restaurant/billing" ? "pos-in" : ""}`} id="v">
            {children}
          </div>
        </main>

        {/* Quick Add Modal */}
        <div
          className={`ov ${quickOpen ? "on" : ""}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setQuickOpen(false);
          }}
        >
          <div className="md">
            <h3>What would you like to do?</h3>
            <div className="big">
              {[
                {
                  title: "Quick Billing / POS",
                  sub: "Rapid counter order & thermal bill",
                  href: "/restaurant/billing",
                },
                {
                  title: "Log an expense",
                  sub: "Bill, purchase or wastage",
                  href: "/restaurant/expenses?action=new",
                },
                {
                  title: "Add an ingredient",
                  sub: "Track a new stock item",
                  href: "/restaurant/inventory?action=new",
                },
                {
                  title: "Add a dish",
                  sub: "Put it on the menu",
                  href: "/restaurant/menu?action=new",
                },
                {
                  title: "Add a table",
                  sub: "Creates a new QR code",
                  href: "/restaurant/tables?action=new",
                },
                {
                  title: "Add a staff member",
                  sub: "Generates a login ID",
                  href: "/restaurant/staff?action=new",
                },
              ].map((act) => (
                <button
                  key={act.title}
                  onClick={() => {
                    setQuickOpen(false);
                    router.push(act.href);
                  }}
                >
                  <div>
                    <b>{act.title}</b>
                    <small>{act.sub}</small>
                  </div>
                </button>
              ))}
            </div>
            <div className="ac" style={{ marginTop: 16 }}>
              <button className="btn s" onClick={() => setQuickOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Mobile More Sheet Modal */}
        <div
          className={`ov ${moreOpen ? "on" : ""}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("ov")) setMoreOpen(false);
          }}
        >
          <div className="md">
            <h3>More</h3>
            <div className="big t">
              {[
                { label: "Expenses", icon: "ex", href: "/restaurant/expenses" },
                { label: "Stock", icon: "st", href: "/restaurant/inventory" },
                { label: "Menu", icon: "mn", href: "/restaurant/menu" },
                { label: "Tables & QR", icon: "tb", href: "/restaurant/tables" },
                { label: "Staff", icon: "pp", href: "/restaurant/staff" },
                { label: "Payouts", icon: "se", href: "/restaurant/settlements" },
                { label: "Onboarding", icon: "ob", href: "/restaurant/onboarding" },
                { label: "Settings", icon: "cf", href: "/restaurant/settings" },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setMoreOpen(false);
                    router.push(m.href);
                  }}
                >
                  <Icon name={m.icon} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="ac" style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn r sm"
                onClick={() => {
                  setMoreOpen(false);
                  handleLogout();
                }}
              >
                Sign out
              </button>
              <button className="btn s sm" onClick={() => setMoreOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <SubscriptionLockModal />
    </RoleGuard>
  );
}
