export type AssistantPage =
  | "general"
  | "home"
  | "onboarding"
  | "login"
  | "dashboard"
  | "menu"
  | "ordering"
  | "billing"
  | "tables"
  | "staff"
  | "kitchen"
  | "payments"
  | "subscription"
  | "franchise"
  | "platform"
  | "settings"
  | "inventory";

export type AssistantMessage = { role: "user" | "assistant"; text: string };
export type AssistantReply = { answer: string; source: "gemini" | "guide" };

const MAX_TEXT_RUNES = 1000;
const MAX_ANSWER_RUNES = 4000;
const HISTORY_PAIRS = 3;

const SUGGESTIONS: Record<AssistantPage, { label: string; suggestions: string[] }> = {
  general: {
    label: "TableOS helper",
    suggestions: [
      "What can you help me with?",
      "How does table QR ordering work?",
      "Where do I find my orders?",
    ],
  },
  home: {
    label: "Welcome to TableOS",
    suggestions: [
      "How do I get started?",
      "How does QR ordering work?",
      "How do I change the theme?",
    ],
  },
  onboarding: {
    label: "Restaurant setup",
    suggestions: [
      "How do I set up a restaurant?",
      "How do table seat counts work?",
      "How do I add Half/Full portions?",
    ],
  },
  login: {
    label: "Sign in",
    suggestions: [
      "Which login page should I use?",
      "How do I reset my password?",
      "Who is the platform admin login for?",
    ],
  },
  dashboard: {
    label: "Restaurant dashboard",
    suggestions: [
      "What can I manage from the dashboard?",
      "Where do I see today's orders?",
      "Where are subscription settings?",
    ],
  },
  menu: {
    label: "Menu",
    suggestions: [
      "How do portions like Half/Full work?",
      "How do I add a dish with portions?",
      "How do diners choose a portion?",
    ],
  },
  ordering: {
    label: "Ordering",
    suggestions: [
      "How do I place an order?",
      "How do I pick a portion size?",
      "How do I ask a waiter for help?",
    ],
  },
  billing: {
    label: "Bill & pay",
    suggestions: [
      "How do I pay my bill?",
      "What is an exit pass?",
      "Who can help with a payment issue?",
    ],
  },
  tables: {
    label: "Tables & QR",
    suggestions: [
      "How do I set seats per table?",
      "How do I print a table QR?",
      "What seat counts are allowed?",
    ],
  },
  staff: {
    label: "Staff service",
    suggestions: [
      "How does waiter assignment work?",
      "Why can't I act on a table?",
      "How do managers reassign a waiter?",
    ],
  },
  kitchen: {
    label: "Kitchen queue",
    suggestions: [
      "How do I update an order's status?",
      "Where do new orders appear?",
      "How do I mark an item served?",
    ],
  },
  payments: {
    label: "Payments",
    suggestions: [
      "How do I confirm a cash payment?",
      "Where do I review payment details?",
      "Who can settle a bill?",
    ],
  },
  subscription: {
    label: "Subscription & billing",
    suggestions: [
      "How do I renew my subscription?",
      "Why was my OTP rejected?",
      "Who provides the activation OTP?",
    ],
  },
  franchise: {
    label: "Franchise suite",
    suggestions: [
      "How do I generate an invite code?",
      "How does an outlet join my franchise?",
      "What can outlet admins see?",
    ],
  },
  platform: {
    label: "Platform admin",
    suggestions: [
      "What is the /spadmin console?",
      "How do I issue an activation OTP?",
      "How do I suspend a restaurant?",
    ],
  },
  settings: {
    label: "Settings & themes",
    suggestions: [
      "How do I change the theme?",
      "What customer skins exist?",
      "Where is light/dark mode?",
    ],
  },
  inventory: {
    label: "Stock & finances",
    suggestions: [
      "Where do I track stock?",
      "Where are expenses and payouts?",
      "Where is profit & loss?",
    ],
  },
};

export function getAssistantContext(pathname: string): {
  page: AssistantPage;
  label: string;
  suggestions: string[];
} {
  const p = (pathname || "/").split("?")[0].split("#")[0].toLowerCase();

  const pick = (page: AssistantPage) => ({ page, ...SUGGESTIONS[page] });

  if (
    /^\/(?:login|forgot-password|reset-password|staff\/(?:login|forgot-password|reset-password)|auth\/(?:forgot-password|reset-password)|spadmin\/login)(?:\/|$)/.test(
      p
    ) ||
    /^\/r\/[^/]+\/staff\/login(?:\/|$)/.test(p)
  ) {
    return pick("login");
  }
  if (/^\/spadmin(?:\/|$)/.test(p)) return pick("platform");
  if (/^\/admin(?:\/|$)/.test(p)) return pick("platform");
  if (/^\/(?:signup|onboarding|restaurant\/onboarding)(?:\/|$)/.test(p)) return pick("onboarding");

  if (/^\/dine\/[^/]+\/menu(?:\/|$)/.test(p)) return pick("menu");
  if (/^\/dine\/[^/]+\/(?:bill|exit)(?:\/|$)/.test(p)) return pick("billing");
  if (/^\/dine\/[^/]+\/checkout(?:\/|$)/.test(p)) return pick("ordering");
  if (/^\/dine\/[^/]+\/orders(?:\/|$)/.test(p)) return pick("ordering");
  if (/^\/dine(?:\/|$)/.test(p)) return pick("ordering");
  if (/^\/t(?:\/|$)/.test(p)) return pick("ordering");

  if (/^\/staff\/payments(?:\/|$)/.test(p)) return pick("payments");
  if (/^\/staff\/orders(?:\/|$)/.test(p)) return pick("staff");
  if (/^\/staff\/tables(?:\/|$)/.test(p)) return pick("tables");
  if (/^\/kitchen(?:\/|$)/.test(p)) return pick("kitchen");
  if (/^\/staff(?:\/|$)/.test(p)) return pick("staff");
  if (/^\/guard(?:\/|$)/.test(p)) return pick("staff");

  if (/^\/restaurant\/subscription(?:\/|$)/.test(p)) return pick("subscription");
  if (/^\/restaurant\/franchise(?:\/|$)/.test(p) || /^\/franchise(?:\/|$)/.test(p)) return pick("franchise");
  if (/^\/restaurant\/(?:inventory|expenses|analytics|settlements)(?:\/|$)/.test(p)) return pick("inventory");
  if (/^\/restaurant\/tables(?:\/|$)/.test(p)) return pick("tables");
  if (/^\/restaurant\/menu(?:\/|$)/.test(p)) return pick("menu");
  if (/^\/restaurant\/staff(?:\/|$)/.test(p)) return pick("staff");
  if (/^\/restaurant\/orders(?:\/|$)/.test(p)) return pick("ordering");
  if (/^\/restaurant\/settings(?:\/|$)/.test(p)) return pick("settings");
  if (/^\/restaurant\/dashboard(?:\/|$)/.test(p)) return pick("dashboard");
  if (/^\/restaurant(?:\/|$)/.test(p)) return pick("dashboard");
  if (/^\/r(?:\/|$)/.test(p)) return pick("home");
  if (p === "/" || p === "") {
    return { page: "home", label: SUGGESTIONS.home.label, suggestions: ["Show me around", ...SUGGESTIONS.home.suggestions] };
  }
  if (/^\/[^/]+\/dashboard\/?$/.test(p)) return pick("dashboard");

  return pick("general");
}

export function assistantHistory(messages: AssistantMessage[]): AssistantMessage[] {
  if (!Array.isArray(messages)) return [];

  const clean = messages
    .filter(
      (m): m is AssistantMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string"
    )
    .map((m) => ({ role: m.role, text: truncateRunes(m.text.trim(), MAX_TEXT_RUNES) }))
    .filter((m) => m.text.length > 0);

  if (clean.length > 0 && clean[clean.length - 1].role === "user") {
    clean.pop();
  }
  let pairs = Math.floor(clean.length / 2);
  if (pairs > HISTORY_PAIRS) pairs = HISTORY_PAIRS;
  const tail = clean.slice(clean.length - pairs * 2);
  if (tail.length === 0) return [];
  for (let i = 0; i < tail.length; i++) {
    const want = i % 2 === 0 ? "user" : "assistant";
    if (tail[i].role !== want) return [];
  }
  return tail;
}

function truncateRunes(s: string, max: number): string {
  const chars = Array.from(s);
  return chars.length <= max ? s : chars.slice(0, max).join("");
}

export async function askAssistant(
  message: string,
  page: AssistantPage,
  history: AssistantMessage[],
  signal: AbortSignal
): Promise<AssistantReply> {
  const res = await fetch("/api/v1/public/assistant/chat", {
    method: "POST",
    credentials: "omit",
    cache: "no-store",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      page,
      history: assistantHistory(history),
    }),
  });

  if (res.status === 429) {
    throw new AssistantRequestError(
      "Tabi is helping a few people at once — please wait a moment and try again.",
      429
    );
  }
  if (!res.ok) {
    throw new AssistantRequestError("Tabi couldn't answer right now. Please try again in a moment.", res.status);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AssistantRequestError("Tabi gave an unreadable reply. Please try again.", res.status);
  }

  const reply = data as { answer?: unknown; source?: unknown };
  if (
    typeof reply?.answer !== "string" ||
    reply.answer.trim() === "" ||
    Array.from(reply.answer.trim()).length > MAX_ANSWER_RUNES ||
    (reply.source !== "gemini" && reply.source !== "guide")
  ) {
    throw new AssistantRequestError("Tabi gave an unexpected reply. Please try again.", res.status);
  }

  return {
    answer: reply.answer.trim(),
    source: reply.source,
  };
}

export class AssistantRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AssistantRequestError";
    this.status = status;
  }
}
