"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  selectCartItemsList,
  selectCartSubtotalMinor,
  updateQuantity,
  updateInstructions,
  removeItem,
  clearCart,
} from "@/store/slices/cartSlice";
import { usePlaceOrderMutation } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { generateUUID } from "@/lib/idempotency";
import { addToast } from "@/store/slices/uiSlice";
import { translateBackendError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function CustomerCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector(selectCartItemsList);
  const cartSubtotalMinor = useAppSelector(selectCartSubtotalMinor);
  const savedCustomerName =
    useAppSelector((state) => state.auth.customerName) || "Guest Diner";

  const [customerName, setCustomerName] = useState(savedCustomerName);
  const [customerPhone, setCustomerPhone] = useState("+91 ");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setErrorMessage(null);

    try {
      const idempotencyKey = generateUUID();
      const payloadItems = cartItems.map((ci) => ({
        menu_item_id: ci.menuItem.id,
        quantity: ci.quantity,
        special_instructions: ci.specialInstructions || undefined,
      }));

      const createdOrder = await placeOrder({
        sessionId,
        data: { items: payloadItems },
        idempotencyKey,
      }).unwrap();

      // Clear local cart
      dispatch(clearCart());

      if (createdOrder.first_order_verification_otp && typeof window !== "undefined") {
        sessionStorage.setItem(`table_os_otp_${sessionId}`, createdOrder.first_order_verification_otp);
      }

      dispatch(
        addToast({
          type: "success",
          title: "Order Placed Successfully!",
          message: createdOrder.first_order_verification_otp
            ? `Your verification code is ${createdOrder.first_order_verification_otp}`
            : "Your order has been sent to the kitchen.",
          durationMs: 5000,
        })
      );

      // Navigate to order tracker
      router.push(`/dine/${sessionId}/orders`);
    } catch (err: unknown) {
      console.error("Order submission failed:", err);
      const translated = translateBackendError(err);
      setErrorMessage(translated);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-gray-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-100 font-display">
          Your Cart is Empty
        </h3>
        <p className="text-xs text-gray-400 max-w-xs mt-1 mb-6">
          Explore delicious dishes from the menu to build your meal.
        </p>
        <Link href={`/dine/${sessionId}/menu`}>
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dine/${sessionId}/menu`}
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-100 font-display">
            Review Your Order
          </h1>
          <p className="text-[11px] text-gray-400">
            Table T1 • Instant Kitchen Transmission
          </p>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex flex-col gap-3">
        {cartItems.map((item) => (
          <Card key={item.menuItem.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-100 font-display">
                  {item.menuItem.name}
                </h4>
                <div className="text-xs text-primary font-bold font-mono mt-0.5">
                  {formatMoney(
                    item.menuItem.price.amount_minor_units * item.quantity
                  )}
                  <span className="text-gray-500 font-normal text-[11px] ml-1.5">
                    ({formatMoney(item.menuItem.price.amount_minor_units)} each)
                  </span>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 bg-surface-subtle border border-surface-border rounded-xl px-2 py-1">
                <button
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: item.menuItem.id,
                        quantity: item.quantity - 1,
                      })
                    )
                  }
                  className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold font-mono px-1">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: item.menuItem.id,
                        quantity: item.quantity + 1,
                      })
                    )
                  }
                  className="w-5 h-5 rounded bg-primary text-background flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => dispatch(removeItem(item.menuItem.id))}
                  className="ml-1 text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Item Instructions */}
            <input
              type="text"
              value={item.specialInstructions || ""}
              onChange={(e) =>
                dispatch(
                  updateInstructions({
                    menuItemId: item.menuItem.id,
                    instructions: e.target.value,
                  })
                )
              }
              placeholder="Add cooking note (e.g. extra spicy, crispy)..."
              className="w-full text-xs px-3 py-1.5 rounded-lg bg-surface-subtle border border-surface-border/60 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </Card>
        ))}
      </div>

      {/* Customer Info Card */}
      <Card className="p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Diner Details
        </h4>
        <Input
          label="Your Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Name for order callout"
        />
        <Input
          label="Phone Number (For SMS Updates & OTP)"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </Card>

      {/* Bill Estimation Note */}
      <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between text-gray-300">
          <span>Estimated Items Subtotal:</span>
          <span className="font-bold font-mono text-gray-100">
            {formatMoney(cartSubtotalMinor)}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-tight">
          * Applicable taxes (2.5% CGST + 2.5% SGST) will be added upon order placement.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-400">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Place Order CTA Button */}
      <div className="pt-2 pb-6">
        <Button
          onClick={handlePlaceOrder}
          isLoading={isLoading}
          variant="gold"
          size="lg"
          className="w-full font-bold shadow-xl shadow-amber-500/20"
        >
          Place Order • {formatMoney(cartSubtotalMinor)}
        </Button>
      </div>
    </div>
  );
}
