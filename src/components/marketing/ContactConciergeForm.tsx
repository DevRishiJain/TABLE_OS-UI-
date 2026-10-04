"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Send,
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

  const sectionRef = useRef<HTMLElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  // Interactive spotlight tracking cursor across the section
  useEffect(() => {
    const sec = sectionRef.current;
    const dark = darkRef.current;
    if (!sec || !dark) return;
    if (!matchMedia("(hover:hover)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = sec.getBoundingClientRect();
      dark.style.setProperty("--cmx", (e.clientX - r.left) + "px");
      dark.style.setProperty("--cmy", (e.clientY - r.top) + "px");
    };
    sec.addEventListener("mousemove", onMove);
    return () => sec.removeEventListener("mousemove", onMove);
  }, []);

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
    <section id="contact" ref={sectionRef} className="contact-section scroll-mt-20">
      {/* Thank You Luxury Hospitality Centerpiece Asset (Different from hero plate) */}
      <div className="contact-spotlight-asset hidden lg:flex" aria-hidden="true">
        <div className="contact-spotlight-glow" />
        <img
          src="/marketing/thank-you-spotlight-topdown.jpg"
          alt="TableOS Hospitality - Thank You"
          className="contact-spotlight-img"
        />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14100C]/90 border border-[#F4ECDD]/15 text-xs font-mono font-medium text-[#F4ECDD] backdrop-blur-md -mt-8 z-10 shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>TABLEOS CONCIERGE · SERVING 200+ VENUES</span>
        </div>
      </div>

      {/* Interactive Cursor Spotlight Overlay */}
      <div className="contact-dark" ref={darkRef} />

      {/* 1. TOP TITLE & SUBTITLE (Exact twin of .theme-section) */}
      <div className="contact-head">
        <h2>
          Let&apos;s set up <em>your venue.</em>
        </h2>
        <p className="contact-sub">
          We&apos;ll build your menu and table layout with you, then switch on two free months. No credit card needed.
        </p>
      </div>

      {/* 2. FORM & INFO WRAPPER */}
      <div className="w-full max-w-2xl lg:max-w-[620px] xl:max-w-[660px] flex flex-col gap-6 mt-12">
        {/* Form Card */}
        <div className="rounded-3xl bg-surface/90 border border-surface-border p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Glow accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {submitted ? (
            <div className="min-h-[380px] rounded-2xl bg-surface-subtle/50 border border-emerald-500/40 p-8 flex flex-col items-center justify-center text-center space-y-5 animate-scale-up">
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

              <div className="p-4 rounded-xl bg-surface border border-surface-border text-left w-full max-w-md space-y-1.5 text-xs text-gray-300 font-mono">
                <div>Reference ID: <span className="text-primary font-bold">{leadId}</span></div>
                <div>Restaurant: <span className="text-white">{restaurantName}</span></div>
                <div>Role: <span className="text-gray-400">{authority}</span></div>
                <div>Venue Concept: <span className="text-gray-400">{restaurantType}</span></div>
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
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div>
                  <h3 className="text-xl font-bold font-display text-white">
                    Request Demo &amp; Complimentary Onboarding
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fill in your venue details. Our regional specialist will schedule your personalized walkthrough.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono text-primary font-bold bg-primary/15 border border-primary/30 shrink-0">
                  2 MONTHS FREE
                </span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Your Full Name */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 transition-colors"
                  />
                </div>

                {/* Restaurant Name */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Restaurant / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Spice Route Bistro"
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 transition-colors"
                  />
                </div>

                {/* Authority / Designation */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Your Role / Authority *
                  </label>
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="Owner" className="bg-[#14100C] text-[#F4ECDD]">Owner / Managing Partner</option>
                    <option value="General Manager" className="bg-[#14100C] text-[#F4ECDD]">General Manager / Director</option>
                    <option value="Floor Manager" className="bg-[#14100C] text-[#F4ECDD]">Floor Manager</option>
                    <option value="Executive Chef" className="bg-[#14100C] text-[#F4ECDD]">Executive Chef / Head Chef</option>
                    <option value="Operations Staff" className="bg-[#14100C] text-[#F4ECDD]">Operations / Service Staff</option>
                  </select>
                </div>

                {/* Restaurant Type */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Restaurant Concept / Type *
                  </label>
                  <select
                    value={restaurantType}
                    onChange={(e) => setRestaurantType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="Fine Dine Restaurant" className="bg-[#14100C] text-[#F4ECDD]">Fine Dine Restaurant</option>
                    <option value="Cafe & Bakery" className="bg-[#14100C] text-[#F4ECDD]">Cafe &amp; Bakery</option>
                    <option value="Drive-In / Car-O-Bar" className="bg-[#14100C] text-[#F4ECDD]">Drive-In / Car-O-Bar</option>
                    <option value="Hotel & Banquets" className="bg-[#14100C] text-[#F4ECDD]">Hotel &amp; Banquets / Room Service</option>
                    <option value="Cloud Kitchen / QSR" className="bg-[#14100C] text-[#F4ECDD]">Cloud Kitchen / QSR</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@spiceroute.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 transition-colors"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Special Requirements / Current Challenges (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Need raw material sourcing, packaging consumables, wastage calculator & KDS for 18 tables..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary placeholder:text-gray-500 resize-none transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-brand flex-1 justify-center py-3.5 px-6 text-sm sm:text-base font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Notifying Concierge Team...</span>
                  ) : (
                    <>
                      <span>Book my demo and start free</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
                <Link
                  href="/signup"
                  className="btn-outline px-8 py-3.5 text-sm sm:text-base font-bold justify-center text-center flex items-center"
                >
                  Sign up
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* 3. CONTACT & EMAIL INFO DIRECTLY BELOW FORM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hotline Card */}
          <div className="p-5 rounded-2xl bg-surface/80 border border-surface-border flex items-center gap-4 shadow-sm hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-400 font-medium">Toll-free hotline</div>
              <a
                href="tel:+9118008903240"
                className="text-base font-bold text-white hover:text-primary transition-colors font-mono block truncate mt-0.5"
              >
                +91 1800 890 3240
              </a>
              <span className="text-xs text-gray-500 font-mono">+91 98765 43210</span>
            </div>
          </div>

          {/* Email Card */}
          <div className="p-5 rounded-2xl bg-surface/80 border border-surface-border flex items-center gap-4 shadow-sm hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-400 font-medium">Concierge email</div>
              <a
                href="mailto:concierge@tableos.in"
                className="text-base font-bold text-white hover:text-primary transition-colors font-mono block truncate mt-0.5"
              >
                concierge@tableos.in
              </a>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Under 2-hour response
              </span>
            </div>
          </div>

          {/* Support Card */}
          <div className="p-5 rounded-2xl bg-surface/80 border border-surface-border flex items-center gap-4 shadow-sm hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-400 font-medium">Support</div>
              <div className="text-base font-bold text-white mt-0.5">24/7 priority help</div>
              <span className="text-xs text-gray-400">On-site setup &amp; training</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pt-1">
          Zero credit card required • Instant trial activation • Unlimited staff seats
        </p>
      </div>
    </section>
  );
}
