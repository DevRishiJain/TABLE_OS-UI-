import { WSEnvelope, WSTicketResponse } from "@/types/api";

export type WSConnectionStatus = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export type WSEventHandler<T = any> = (envelope: WSEnvelope<T>) => void;
export type WSStatusHandler = (status: WSConnectionStatus) => void;

class TableOSWebSocketClient {
  private socket: WebSocket | null = null;
  private status: WSConnectionStatus = "CLOSED";
  private lastEventId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 15000;
  private reconnectTimer: any = null;
  private listeners: Map<string, Set<WSEventHandler>> = new Map();
  private wildcardListeners: Set<WSEventHandler> = new Set();
  private statusListeners: Set<WSStatusHandler> = new Set();
  private isExplicitClose = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        if (this.status === "CLOSED" && !this.isExplicitClose) {
          this.reconnectAttempts = 0;
          this.connect();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          this.status === "CLOSED" &&
          !this.isExplicitClose
        ) {
          this.reconnectAttempts = 0;
          this.connect();
        }
      });
    }
  }

  public getStatus(): WSConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === "OPEN";
  }

  public getLastEventId(): string | null {
    return this.lastEventId;
  }

  public onStatusChange(handler: WSStatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  public on<T = any>(eventType: string, handler: WSEventHandler<T>): () => void {
    if (eventType === "*") {
      this.wildcardListeners.add(handler);
      return () => {
        this.wildcardListeners.delete(handler);
      };
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  private setStatus(newStatus: WSConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => {
        try {
          fn(newStatus);
        } catch (e) {
          console.error("[WS] Status listener error:", e);
        }
      });
    }
  }

  public async connect(): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.status === "OPEN" || this.status === "CONNECTING") return;

    this.isExplicitClose = false;
    this.setStatus("CONNECTING");

    try {
      // 1. Acquire single-use authentication ticket
      const ticket = await this.acquireTicket();
      if (!ticket) {
        // No authentication credentials or expired token; stop reconnect loop
        this.setStatus("CLOSED");
        return;
      }

      // 2. Build WebSocket URL with ticket and optional last_event_id for resume replay
      const wsUrl = this.buildWebSocketUrl(ticket);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("OPEN");
      };

      this.socket.onmessage = (event) => {
        try {
          const envelope: WSEnvelope = JSON.parse(event.data);
          if (envelope.id) {
            this.lastEventId = envelope.id;
          }
          this.dispatchEnvelope(envelope);
        } catch (err) {
          console.warn("[WS] Failed to parse message:", event.data, err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn("[WS] Socket error:", err);
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.setStatus("CLOSED");
        if (!this.isExplicitClose) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.warn("[WS] Connection failed (network/transient):", err);
      this.setStatus("CLOSED");
      if (!this.isExplicitClose) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    this.isExplicitClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("CLOSED");
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[WS] Max reconnect attempts reached; waiting for user focus or network reconnect.");
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with 20% jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    const jitter = delay * (0.8 + Math.random() * 0.4);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, jitter);
  }

  private async acquireTicket(): Promise<string | null> {
    const sessionToken =
      typeof window !== "undefined"
        ? localStorage.getItem("tableos_session_token") || null
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("tableos_staff_token") || null
        : null;

    if (!staffToken && !sessionToken) {
      // No credentials present yet; do not poll or spam the ticket endpoint
      return null;
    }

    // In browser, use same-origin relative URL ("") to route through Next.js proxy without CORS preflight
    const baseUrl =
      typeof window !== "undefined"
        ? ""
        : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8088");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (staffToken) {
      headers["Authorization"] = `Bearer ${staffToken}`;
    } else if (sessionToken) {
      headers["X-Session-Token"] = sessionToken;
    }

    const res = await fetch(`${baseUrl}/api/v1/ws/ticket`, {
      method: "POST",
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      // Credentials invalid or expired; log once and do NOT trigger a reconnect loop
      console.warn("[WS] Ticket acquisition unauthorized (token invalid or expired). Awaiting fresh login.");
      return null;
    }

    if (!res.ok) {
      throw new Error(`Ticket acquisition failed with HTTP ${res.status}`);
    }

    const data: WSTicketResponse = await res.json();
    return data.ticket;
  }

  private buildWebSocketUrl(ticket: string): string {
    let wsHost: string;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (apiBase) {
      wsHost = apiBase.replace(/^http/, "ws");
    } else if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsHost = `${protocol}//${window.location.host}`;
    } else {
      wsHost = "ws://localhost:8088";
    }

    let url = `${wsHost}/ws/v1?ticket=${encodeURIComponent(ticket)}`;
    if (this.lastEventId) {
      url += `&last_event_id=${encodeURIComponent(this.lastEventId)}`;
    }
    return url;
  }

  private dispatchEnvelope(env: WSEnvelope) {
    // 1. Wildcard listeners
    this.wildcardListeners.forEach((fn) => {
      try {
        fn(env);
      } catch (err) {
        console.error("[WS] Wildcard handler error:", err);
      }
    });

    // 2. Type-specific listeners
    const handlers = this.listeners.get(env.t);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(env);
        } catch (err) {
          console.error(`[WS] Handler error for ${env.t}:`, err);
        }
      });
    }
  }
}

// Global singleton instance
export const wsClient = new TableOSWebSocketClient();
