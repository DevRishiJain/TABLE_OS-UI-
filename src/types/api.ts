import { DiningSession, Order, Payment, ExitPass, MenuItem, MenuCategory, Table, StaffUser, Restaurant, RestaurantSettings, PlatformFeeLedgerEntry, RestaurantSettlement } from "./domain";
import { OrderState, PaymentMethod, PaymentStatus } from "./enums";

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
}

export interface CreateOrderRequest {
  items: Array<{
    menu_item_id: string;
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
