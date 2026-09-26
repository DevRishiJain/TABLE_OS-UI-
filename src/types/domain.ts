import { SessionState, OrderState, PaymentMethod, PaymentStatus, StaffRole, ExitPassStatus } from "./enums";

export interface Money {
  amount_minor_units: number;
  currency: string;
}

export interface DiningSession {
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
  id: string;
  restaurant_id: string;
  table_id: string;
  status: SessionState;
  opened_at: string;
  closed_at?: string;
  verified_at?: string;
  verified_by_staff_id?: string;
  running_total: Money;
  final_total: Money;
  platform_fee_amount: Money;
  session_token: string;
  device_fingerprint: string;
  last_activity_at: string;
  expiry_deadline: string;
  close_reason?: string;
  closed_by_actor_type?: string;
  closed_by_actor_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  menu_item_id?: string;
  item_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: Money;
  line_total: Money;
  hsn_sac_code_snapshot?: string;
  cgst_rate_bps_snapshot?: number;
  sgst_rate_bps_snapshot?: number;
  cgst_amount?: Money;
  sgst_amount?: Money;
  special_instructions?: string;
  specialInstructions?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  session_id: string;
  restaurant_id: string;
  sequence_number: number;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
  status: OrderState;
  placed_at: string;
  accepted_at?: string;
  accepted_by_staff_id?: string;
  subtotal: Money;
  tax_total: Money;
  total: Money;
  cancellation_fee_applicable?: boolean;
  items: OrderItem[];
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  session_id: string;
  restaurant_id: string;
  method: PaymentMethod;
  amount: Money;
  status: PaymentStatus;
  gateway_reference_id?: string;
  evidence_transaction_id?: string;
  evidence_photo_url?: string;
  confirmed_by_staff_id?: string;
  confirmed_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ExitPass {
  id: string;
  session_id: string;
  restaurant_id: string;
  status: ExitPassStatus;
  otp_hash?: string;
  otp?: string;
  expires_at: string;
  issued_at: string;
  used_at?: string;
  used_by_guard_id?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: Money;
  is_available: boolean;
  hsn_sac_code: string;
  cgst_rate_bps: number;
  sgst_rate_bps: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  table_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffUser {
  id: string;
  restaurant_id: string;
  employee_id?: string;
  name: string;
  phone: string;
  email: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  gstin: string;
  commission_rate_bps: number;
  settlement_bank_details: string;
  status: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  restaurant_id: string;
  exit_verification_mode: string;
  shared_session_policy: string;
  high_value_threshold_minor: number;
  rapid_order_jump_factor: number;
  external_evidence_required: boolean;
  pos_evidence_required: boolean;
  first_order_otp_ttl_minutes: number;
  exit_pass_otp_ttl_minutes: number;
  updated_at: string;
}

export interface PlatformFeeLedgerEntry {
  id: string;
  restaurant_id: string;
  session_id: string;
  gmv_amount: Money;
  fee_amount: Money;
  fee_rate_applied: number;
  billing_period: string;
  settlement_status: string;
  created_at: string;
}

export interface RestaurantSettlement {
  id: string;
  restaurant_id: string;
  period_start: string;
  period_end: string;
  gross_sales: Money;
  platform_fees_owed: Money;
  refund_adjustments: Money;
  net_payable_platform: Money;
  status: string;
  invoiced_at?: string;
  settled_at?: string;
  created_at: string;
}
