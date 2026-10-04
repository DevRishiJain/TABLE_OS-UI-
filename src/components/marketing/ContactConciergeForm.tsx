"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Building,
  User,
  Shield,
  Utensils,
  ArrowRight,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";

export function ContactConciergeForm() {
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [authority, setAuthority] = useState("Owner");
  const [restaurantType, setRestaurantType] = useState("Fine Dine Restaurant");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !restaurantName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg("Please fill in your name, restaurant name, email, and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          restaurantName: restaurantName.trim(),
          authority,
          restaurantType,
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setLeadId(data.leadId || `LEAD-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please call us directly at +91 1800 890 3240.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact" className="w-full scroll-mt-24">
      <div className="rounded-3xl bg-surface border border-surface-border p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
          {/* Left Column: Direct Info & Customer Care */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>2 Months Free Trial Onboarding</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
                Transform Your Venue Today.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Connect with our hospitality solutions team. We’ll schedule a personalized walkthrough, configure your menu & table layout, and activate your 2-month complimentary trial.
              </p>
            </div>

            {/* Customer Care Desk Contact Card */}
            <div className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Dedicated Customer Care Desk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Toll-Free Hospitality Hotline</div>
                    <a
                      href="tel:+9118008903240"
                      className="text-sm font-bold text-white hover:text-primary transition-colors font-mono"
                    >
                      +91 1800 890 3240
                    </a>
                    <span className="text-xs text-gray-400 ml-2">/ +91 98765 43210</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Direct Concierge Email</div>
                    <a
                      href="mailto:concierge@tableos.in"
                      className="text-sm font-bold text-white hover:text-cyan-400 transition-colors font-mono"
                    >
                      concierge@tableos.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Support Hours</div>
                    <div className="text-xs font-semibold text-gray-200">
                      24/7 Priority Support & On-Ground Setup
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Zero credit card required • Instant trial activation • Unlimited staff seats
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="h-full min-h-[440px] rounded-2xl bg-surface border border-emerald-500/40 p-8 flex flex-col items-center justify-center text-center space-y-5 animate-scale-up">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display text-white">
                    Inquiry Dispatched Successfully!
                  </h3>
                  <p className="text-sm text-gray-300 max-w-md">
                    Thank you, <strong className="text-white">{name}</strong>. An email notification has been dispatched to our hospitality team at <strong className="text-primary font-mono">concierge@tableos.in</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border text-left w-full max-w-sm space-y-1.5 text-xs text-gray-300 font-mono">
                  <div>Reference ID: <span className="text-primary font-bold">{leadId}</span></div>
                  <div>Restaurant: <span className="text-white">{restaurantName}</span></div>
                  <div>Role: <span className="text-gray-400">{authority}</span></div>
                  <div>Venue: <span className="text-gray-400">{restaurantType}</span></div>
                </div>

                <p className="text-xs text-gray-400">
                  Our regional restaurant specialist will contact you at <span className="text-white font-mono">{phone}</span> within 2 hours.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setRestaurantName("");
                    setMessage("");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-xs font-semibold text-gray-200 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl bg-surface border border-surface-border p-6 sm:p-8 space-y-5 shadow-lg"
              >
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <h3 className="text-lg font-bold font-display text-white">
                    Request Demo & Complimentary Onboarding
                  </h3>
                  <span className="text-[11px] font-mono text-primary font-bold">
                    2 MONTHS FREE
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Your Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Vikramaditya Singhania"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Restaurant Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Restaurant / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="e.g. Spice Route Bistro"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500"
                    />
                  </div>

                  {/* Authority / Designation */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Your Role / Authority *
                    </label>
                    <select
                      value={authority}
                      onChange={(e) => setAuthority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                    >
                      <option value="Owner">Owner / Managing Partner</option>
                      <option value="General Manager">General Manager / Director</option>
                      <option value="Floor Manager">Floor Manager</option>
                      <option value="Executive Chef">Executive Chef / Head Chef</option>
                      <option value="Operations Staff">Operations / Service Staff</option>
                    </select>
                  </div>

                  {/* Restaurant Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Restaurant Concept / Type *
                    </label>
                    <select
                      value={restaurantType}
                      onChange={(e) => setRestaurantType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                    >
                      <option value="Fine Dine Restaurant">Fine Dine Restaurant</option>
                      <option value="Cafe & Bakery">Cafe & Bakery</option>
                      <option value="Drive-In / Car-O-Bar">Drive-In / Car-O-Bar</option>
                      <option value="Hotel & Banquets">Hotel & Banquets / Room Service</option>
                      <option value="Cloud Kitchen / QSR">Cloud Kitchen / QSR</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@spiceroute.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Special Requirements / Current Challenges (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Need raw material sourcing, packaging consumables, wastage calculator & KDS for 18 tables..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Notifying Concierge Team...</span>
                  ) : (
                    <>
                      <span>Submit Inquiry & Activate 2 Months Free</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
