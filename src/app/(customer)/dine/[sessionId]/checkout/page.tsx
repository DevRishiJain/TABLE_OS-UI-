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
      <div style={{ paddingTop: 6 }}>
        <div className="bk">
          <Link
            href={`/dine/${sessionId}/menu`}
            className="b i"
            aria-label="Back to menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h2>Review order</h2>
        </div>
        <div className="em">
          <b>Your order is empty</b>
          Add a few dishes first.
          <div style={{ marginTop: 18 }}>
            <Link href={`/dine/${sessionId}/menu`} className="b p">
              Browse the menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 6 }}>
      {/* Header */}
      <div className="bk">
        <Link
          href={`/dine/${sessionId}/menu`}
          className="b i"
          aria-label="Back to menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <h2>Review order</h2>
          <span className="mu sm">Goes straight to the kitchen</span>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="g" style={{ marginTop: 12 }}>
        {cartItems.map((item) => (
          <div key={item.menuItem.id} className="cd" style={{ padding: 16 }}>
            <div className="px">
              <div>
                <b style={{ fontSize: "1.05rem" }}>{item.menuItem.name}</b>
                <div className="pr" style={{ marginTop: 2, color: "var(--ac)" }}>
                  {formatMoney(item.menuItem.price.amount_minor_units * item.quantity)}
                </div>
              </div>

              {/* Stepper */}
              <div className="sp2">
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: item.menuItem.id,
                        quantity: item.quantity - 1,
                      })
                    )
                  }
                  aria-label="Decrease quantity"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      updateQuantity({
                        menuItemId: item.menuItem.id,
                        quantity: item.quantity + 1,
                      })
                    )
                  }
                  aria-label="Increase quantity"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cooking note input */}
            <input
              className="in"
              style={{ marginTop: 12, height: 48 }}
              placeholder="Cooking note, e.g. extra spicy, crispy"
              aria-label={`Note for ${item.menuItem.name}`}
              value={item.specialInstructions || ""}
              onChange={(e) =>
                dispatch(
                  updateInstructions({
                    menuItemId: item.menuItem.id,
                    instructions: e.target.value,
                  })
                )
              }
            />
          </div>
        ))}

        {/* Add more dishes */}
        <Link href={`/dine/${sessionId}/menu`} className="b o">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add more dishes
        </Link>

        {/* Subtotal summary card */}
        <div className="cd">
          <div className="it">
            <span className="mu">Subtotal</span>
            <b style={{ fontSize: "1.2rem", fontFamily: "var(--se)", color: "var(--ac)" }}>
              {formatMoney(cartSubtotalMinor)}
            </b>
          </div>
          <div className="mu sm" style={{ marginTop: 6 }}>
            GST 5% (2.5% CGST + 2.5% SGST) is added to your bill upon order confirmation.
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="say" style={{ background: "color-mix(in srgb, var(--er) 15%, var(--pp))", color: "var(--er)", border: "1px solid color-mix(in srgb, var(--er) 30%, transparent)" }}>
            <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Place Order CTA */}
        <button
          type="button"
          className="b p"
          disabled={isLoading}
          onClick={handlePlaceOrder}
        >
          {isLoading ? "Sending to kitchen..." : `Place order · ${formatMoney(cartSubtotalMinor)}`}
        </button>
      </div>
    </div>
  );
}
