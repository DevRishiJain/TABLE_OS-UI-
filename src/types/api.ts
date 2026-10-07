import { DiningSession, Order, Payment, ExitPass, MenuItem, MenuCategory, Table, StaffUser, Restaurant, RestaurantSettings, PlatformFeeLedgerEntry, RestaurantSettlement, Money } from "./domain";
import { OrderState, PaymentMethod, PaymentStatus } from "./enums";

// Realtime WebSocket Canonical Envelope (§Phase 3.1)
export interface WSEnvelope<T = any> {
  v: number;
  id: string;
  seq: number;
  t: string;
  room: string;
  ts: number;
  d: T;
}

export interface WSTicketResponse {
  ticket: string;
  expires_in: number;
  role: string;
  session_id?: string;
  rooms?: string[];
}


// Public & Session
export interface StartSessionRequest {
  table_token: string;
  customer_name?: string;
  customer_phone?: string;
  phone_number?: string;
  guest_count?: number;
  no_of_guests?: number;
  vehicle_number?: string;
  car_number?: string;
  device_fingerprint?: string;
}

export interface SessionDetailResponse {
  session: DiningSession;
  orders: Order[];
  payments: Payment[];
  exit_pass?: ExitPass | null;
  exit_otp?: string | null;
}

export interface CreateOrderRequest {
  items: Array<{
    menu_item_id: string;
    variant_id?: string;
    quantity: number;
    special_instructions?: string;
  }>;
}

export interface CreateOrderResponse extends Order {
  first_order_verification_otp?: string;
}

export interface CustomerPayRequest {
  method: PaymentMethod;
}

export interface AICatalogResponse {
  categories: MenuCategory[];
  items: MenuItem[];
  raw_image_url?: string;
  status: string;
}

export interface AIQueryRequest {
  restaurant_id: string;
  query: string;
}

export interface AIQueryResponse {
  restaurant_id: string;
  retrieval: {
    query: string;
    answer: string;
    retrieved_items: MenuItem[];
    model: string;
  };
  status: string;
}

// Staff & Operations
export interface StaffTableSummary {
  table_id: string;
  table_number: string;
  is_occupied: boolean;
  active_session_id?: string;
  session_status?: string;
  opened_at?: string;
  running_total_minor?: number;
  unverified_orders_count?: number;
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
  capacity?: number;
  assistance_reason?: string;
  assistance_requested_at?: string;
  assigned_waiter_id?: string | null;
  assigned_waiter_name?: string;
  is_assigned_to_me?: boolean;
}

export interface VerifyFirstOrderRequest {
  otp: string;
}

export interface ConfirmPaymentRequest {
  payment_id?: string;
  session_id: string;
  amount_minor: number;
  method: PaymentMethod;
  evidence_transaction_id?: string;
}

export interface ForceCloseSessionRequest {
  reason: string;
}

// Kitchen KDS
export interface KitchenOrderQueueItem extends Order {
  table_number?: string;
  vehicle_number?: string;
  elapsed_minutes?: number;
}

export interface UpdateKitchenStatusRequest {
  status: OrderState;
}

// Guard
export interface VerifyExitRequest {
  session_id: string;
  otp: string;
}

export interface VerifyExitResponse {
  result: "APPROVED" | "DENIED";
  reason?: string;
  session_id?: string;
}

// Restaurant Admin Analytics
export interface TodayAnalytics {
  date: string;
  timezone: string;
  total_gmv: { amount_minor_units: number; currency: string };
  order_count: number;
  average_order_value: { amount_minor_units: number; currency: string };
  platform_fee_accrued: { amount_minor_units: number; currency: string };
  payment_method_breakdown: Record<string, number>;
  active_session_count: number;
  completed_session_count: number;
  hourly_breakdown?: Array<{
    hour: number;
    gmv_minor: number;
    orders_count: number;
  }>;
}

export interface MonthToDateAnalytics {
  month: string;
  gross_sales_minor: number;
  prev_month_sales_minor: number;
  growth_percentage: number;
  daily_sales?: Array<{
    date: string;
    sales_minor: number;
  }>;
}

export interface PeriodComparison {
  current_period_sales_minor: number;
  previous_period_sales_minor: number;
  change_percentage: number;
  current_orders: number;
  previous_orders: number;
}

export interface PeakHoursMatrix {
  heatmap: number[][]; // 7 days x 24 hours
}

export interface SalesForecast {
  projected_days: Array<{
    date: string;
    projected_sales_minor: number;
    is_projection: true;
    lower_bound_minor?: number;
    upper_bound_minor?: number;
  }>;
  actual_days?: Array<{
    date: string;
    actual_sales_minor: number;
    is_projection: false;
  }>;
}

export interface TablePerformance {
  tables: Array<{
    table_id: string;
    table_number: string;
    turns_count: number;
    avg_turn_minutes: number;
    total_gmv_minor: number;
  }>;
}

export interface MenuPerformance {
  dishes: Array<{
    menu_item_id: string;
    name: string;
    category_name: string;
    quantity_sold: number;
    gmv_minor: number;
    gross_margin_bps: number;
  }>;
}

export interface OnboardingStatus {
  restaurant_id: string;
  current_step: number;
  steps_completed: string[];
  is_live: boolean;
}

export interface CreateExpenseLineItemRequest {
  inventory_item_id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price_minor: number;
  total_price_minor: number;
}

export interface CreateExpenseRequest {
  type: string;
  category: string;
  title: string;
  amount_minor: number;
  currency?: string;
  paid_via: string;
  vendor_name?: string;
  expense_date?: string;
  notes?: string;
  is_stock_purchase?: boolean;
  line_items?: CreateExpenseLineItemRequest[];
}

export interface InventorySummaryResponse {
  items: import("./domain").InventoryItem[];
  total_items_count: number;
  low_stock_items_count: number;
  total_valuation: import("./domain").Money;
}

export interface CreateInventoryItemRequest {
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_threshold: number;
  unit_cost_minor: number;
}

export interface LogStockRequest {
  change_type: string;
  quantity: number;
  unit_cost_minor?: number;
  reference?: string;
}

export interface SaveRecipeItemRequest {
  inventory_item_id: string;
  quantity_required: number;
}



// Subscription OTP (platform-issued activation codes)
export interface SubscriptionOTPInfo {
  id: string;
  days: number;
  plan: string;
  status: "ISSUED" | "USED" | "REVOKED";
  attempts: number;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface SubscriptionOTPResponse {
  otp: string;
  restaurant_id: string;
  restaurant_name: string;
  days: number;
  plan: string;
  expires_at: string;
}

// Platform Admin (super-admin console)
export interface AdminOverview {
  total_restaurants: number;
  active_restaurants: number;
  suspended_restaurants: number;
  franchise_count: number;
  franchise_outlets: number;
  single_restaurants: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  live_sessions: number;
  orders_today: number;
  revenue_today_minor: number;
  platform_gross_sales_minor: number;
  platform_fee_revenue_minor: number;
}

export interface AdminRestaurantEntry extends Restaurant {
  is_active?: boolean;
  slug?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_end_at?: string;
  ownership_type?: string;
  franchise_id?: string;
  franchise_name?: string;
  table_count?: number;
  active_sessions?: number;
  orders_today?: number;
  revenue_today_minor?: number;
  days_remaining?: number;
  is_subscription_active?: boolean;
}

export interface AdminFranchise {
  id: string;
  name: string;
  owner_name?: string;
  owner_email?: string;
  outlet_count: number;
  created_at: string;
  outlets: AdminRestaurantEntry[];
}

export interface AdminActivityFeedItem {
  restaurant_id: string;
  restaurant_name: string;
  table_number: string;
  status: string;
  total: number;
  placed_at: string;
}

export interface AdminRestaurantActivity {
  restaurant: AdminRestaurantEntry;
  subscription: {
    plan: string;
    status: string;
    end_at: string;
    days_remaining: number;
    is_active: boolean;
  };
  tables: Array<{
    table_id: string;
    table_number: string;
    capacity?: number;
    is_active?: boolean;
    is_occupied?: boolean;
    active_session_id?: string;
    session_status?: string;
    customer_name?: string;
    customer_phone?: string;
    guest_count?: number;
    running_total_minor?: number;
    opened_at?: string;
    assigned_waiter_id?: string | null;
    assigned_waiter_name?: string;
  }>;
  active_sessions: DiningSession[];
  recent_orders: Array<{
    id: string;
    sequence_number: number;
    table_number?: string;
    status: string;
    total: Money;
    placed_at: string;
    accepted_by_staff_id?: string;
    accepted_by_name?: string;
    customer_name?: string;
  }>;
  staff: Array<{
    id: string;
    name: string;
    role: string;
    employee_id?: string;
    email: string;
    phone: string;
    is_active: boolean;
  }>;
  recent_audit: Array<Record<string, any>>;
}

// Franchise
export interface FranchiseInviteLookup {
  valid: boolean;
  franchise_id?: string;
  franchise_name?: string;
  expires_at?: string;
}
