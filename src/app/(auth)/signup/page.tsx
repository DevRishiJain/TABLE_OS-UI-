"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setStaffAuth } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { StaffRole } from "@/types/enums";
import { generateClientJWT } from "@/lib/jwt";
import { generateUUID } from "@/lib/idempotency";
import { QRCodeSVG } from "qrcode.react";
import {
  Utensils,
  Store,
  FileText,
  QrCode,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  Printer,
  Sparkles,
  Lock,
  Mail,
  ShieldCheck,
  User,
  ChefHat,
  Banknote,
  Eye,
  EyeOff,
  Building2,
  Phone,
  MapPin,
  Clock,
  Rocket,
  Check,
} from "lucide-react";

interface MenuItemDraft {
  id: string;
  name: string;
  category: string;
  price: number;
  dietary: "veg" | "non-veg" | "vegan";
  description: string;
}

interface StaffDraft {
  id: string;
  name: string;
  email: string;
  role: "WAITER" | "KITCHEN" | "CASHIER" | "MANAGER" | "GUARD";
  employeeId: string;
  password: string;
}

export default function RestaurantSignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Restaurant Info
  const [restaurantName, setRestaurantName] = useState("The Golden Spoon");
  const [slug, setSlug] = useState("golden-spoon");
  const [legalName, setLegalName] = useState("Golden Spoon Hospitality LLP");
  const [gstin, setGstin] = useState("07AABCG1234F1Z5");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("admin@goldenspoon.com");
  const [address, setAddress] = useState("Connaught Place, New Delhi");
  const [cuisine, setCuisine] = useState("North Indian & Mughlai");
  const [currency, setCurrency] = useState("INR");

  // Admin User
  const [adminName, setAdminName] = useState("Vikram Malhotra");
  const [adminEmail, setAdminEmail] = useState("owner@goldenspoon.com");
  const [adminPassword, setAdminPassword] = useState("");

  // STEP 2: Menu Items
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuFileName, setMenuFileName] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([
    {
      id: "1",
      name: "Paneer Butter Masala",
      category: "Main Course",
      price: 360,
      dietary: "veg",
      description: "Cottage cheese simmered in velvety spiced tomato butter gravy",
    },
    {
      id: "2",
      name: "Murgh Tikka Angara",
      category: "Starters",
      price: 440,
      dietary: "non-veg",
      description: "Charcoal grilled tender chicken skewers in fiery hung curd marinade",
    },
    {
      id: "3",
      name: "Garlic Butter Naan",
      category: "Breads",
      price: 80,
      dietary: "veg",
      description: "Clay oven baked flatbread infused with roasted garlic flakes",
    },
    {
      id: "4",
      name: "Classic Mango Kulfi",
      category: "Desserts",
      price: 180,
      dietary: "veg",
      description: "Traditional slow-reduced milk ice cream flavored with Alphonso puree",
    },
  ]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Main Course");
  const [newItemPrice, setNewItemPrice] = useState(299);
  const [newItemDietary, setNewItemDietary] = useState<"veg" | "non-veg" | "vegan">("veg");

  const handleAddMenuItem = () => {
    if (!newItemName.trim()) return;
    const item: MenuItemDraft = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      price: Number(newItemPrice) || 199,
      dietary: newItemDietary,
      description: "Handcrafted chef specialty with farm-fresh ingredients",
    };
    setMenuItems((prev) => [...prev, item]);
    setNewItemName("");
    setNewItemPrice(299);
  };

  const handleRemoveMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((it) => it.id !== id));
  };

  // STEP 3: Tables & QR Code Generator
  const [tableCount, setTableCount] = useState<number>(8);
  const [selectedTableForPreview, setSelectedTableForPreview] = useState<number>(1);

  // STEP 4: Staff Team Roster
  const generateTemporaryPassword = () =>
    "Temp@" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const [staffList, setStaffList] = useState<StaffDraft[]>([
    {
      id: "s1",
      name: "Aman Verma",
      email: "aman.waiter@goldenspoon.com",
      role: "WAITER",
      employeeId: "EMP-WTR-001",
      password: generateTemporaryPassword(),
    },
    {
      id: "s2",
      name: "Chef Rajesh",
      email: "rajesh.chef@goldenspoon.com",
      role: "KITCHEN",
      employeeId: "EMP-CHF-001",
      password: generateTemporaryPassword(),
    },
    {
      id: "s3",
      name: "Sunil Grover",
      email: "sunil.cashier@goldenspoon.com",
      role: "CASHIER",
      employeeId: "EMP-CSH-001",
      password: generateTemporaryPassword(),
    },
  ]);

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<StaffDraft["role"]>("WAITER");
  const [newStaffPassword, setNewStaffPassword] = useState("");

  const getNextEmployeeId = (role: StaffDraft["role"]) => {
    const rolePrefix: Record<StaffDraft["role"], string> = {
      WAITER: "EMP-WTR",
      KITCHEN: "EMP-CHF",
      CASHIER: "EMP-CSH",
      MANAGER: "EMP-MGR",
      GUARD: "EMP-GRD",
    };
    const prefix = rolePrefix[role];
    const existing = staffList.filter((s) => s.employeeId.startsWith(prefix));
    const nextSeq = String(existing.length + 1).padStart(3, "0");
    return `${prefix}-${nextSeq}`;
  };

  const handleAddStaff = () => {
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Info", message: "Please enter staff name and email." }));
      return;
    }
    const autoEmpId = getNextEmployeeId(newStaffRole);
    const newMember: StaffDraft = {
      id: Date.now().toString(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      employeeId: autoEmpId,
      password: newStaffPassword.trim() || generateTemporaryPassword(),
    };
    setStaffList((prev) => [...prev, newMember]);
    setNewStaffName("");
    setNewStaffEmail("");
    dispatch(addToast({ type: "success", title: "Staff Member Added", message: `Provisioned ${autoEmpId} (${newMember.name})` }));
  };

  const handleRemoveStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  // STEP 5: Final Submission & Go-Live
  const handleLaunchRestaurant = async () => {
    setIsSubmitting(true);
    try {
      const generatedRestaurantId = generateUUID();
      const staffUuid = generateUUID();
      const token = await generateClientJWT({
        staff_id: staffUuid,
        restaurant_id: generatedRestaurantId,
        role: "RESTAURANT_ADMIN",
        is_platform: false,
        sub: staffUuid,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      });

      // Update Redux & LocalStorage with new restaurant info
      dispatch(
        setStaffAuth({
          token,
          role: StaffRole.RESTAURANT_ADMIN,
          isPlatformAdmin: false,
          staffId: staffUuid,
          employeeId: "EMP-ADM-001",
          restaurantId: generatedRestaurantId,
          restaurantName: restaurantName,
          userName: adminName,
        })
      );

      // Save credentials list for display
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_staff_roster", JSON.stringify(staffList));
        localStorage.setItem("tableos_restaurant_name", restaurantName);
        localStorage.setItem("tableos_table_count", String(tableCount));
      }

      dispatch(
        addToast({
          type: "success",
          title: "🎉 Restaurant Successfully Onboarded!",
          message: `${restaurantName} is live with ${tableCount} QR tables and ${staffList.length} staff operators.`,
        })
      );

      // Redirect directly to the Restaurant Admin Dashboard
      router.push("/restaurant/dashboard");
    } catch (err: any) {
      console.error(err);
      dispatch(addToast({ type: "error", title: "Onboarding Error", message: "Failed to finalize restaurant launch." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Identity", icon: Store },
    { num: 2, label: "Menu Catalog", icon: FileText },
    { num: 3, label: "Table QRs", icon: QrCode },
    { num: 4, label: "Staff Team", icon: Users },
    { num: 5, label: "Go Live", icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 glass-panel border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold font-display text-gray-100">
              TableOS
            </span>
            <span className="text-[10px] text-primary block font-mono font-bold tracking-wider uppercase">
              Partner Onboarding Engine
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono hidden sm:inline">
            Already have an account?
          </span>
          <Link
            href="/login"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-gray-200 hover:text-white hover:border-primary/50 transition-all"
          >
            Admin Sign In
          </Link>
          <Link
            href="/staff/login"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Staff Login
          </Link>
        </div>
      </header>

      {/* Main Multi-Step Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col justify-center">
        {/* Step Indicator Wizard Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-border -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
            />

            {stepsList.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.num;
              const isActive = currentStep === step.num;

              return (
                <button
                  key={step.num}
                  onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                  disabled={step.num > currentStep}
                  className={`relative z-10 flex flex-col items-center gap-1.5 transition-all focus:outline-none`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                      isCompleted
                        ? "bg-emerald-500 text-black shadow-emerald-500/20"
                        : isActive
                        ? "bg-primary text-black ring-4 ring-primary/20 shadow-primary/30"
                        : "bg-surface border border-surface-border text-gray-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold hidden sm:inline ${
                      isActive ? "text-primary font-extrabold" : isCompleted ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Restaurant Identity & Admin Setup */}
        {currentStep === 1 && (
          <div className="bg-surface border border-surface-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <Store className="w-4 h-4" />
                Step 1 of 5: Restaurant Identity & Ownership
              </div>
              <h2 className="text-xl font-bold font-display text-gray-100 mt-1">
                Tell us about your restaurant
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                These details will be printed on customer invoices, QR standees, and tax reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Restaurant Brand Name *
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => {
                    setRestaurantName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  placeholder="e.g. The Golden Spoon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  URL Handle / Slug
                </label>
                <div className="flex items-center rounded-xl bg-surface-subtle border border-surface-border overflow-hidden">
                  <span className="px-3 text-xs text-gray-500 font-mono">tableos.com/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full py-2.5 pr-3 bg-transparent text-sm text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Legal Entity / Trade Name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Golden Spoon Hospitality LLP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  GSTIN / Tax Identification
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 07AABCG1234F1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Cuisine Specialty
                </label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. North Indian, Continental, Asian"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Restaurant Location & Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Inner Circle, Connaught Place, New Delhi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="pt-4 border-t border-surface-border">
              <h3 className="text-sm font-bold font-display text-gray-200 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Restaurant Owner Credentials (Admin Access)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">
                    Admin Email (Login ID)
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourrestaurant.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!restaurantName.trim()) {
                    dispatch(addToast({ type: "error", title: "Name Required", message: "Please provide your restaurant name." }));
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="px-6 py-3 rounded-2xl bg-primary text-black font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Proceed to Menu Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Digital Menu Cataloging */}
        {currentStep === 2 && (
          <div className="bg-surface border border-surface-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                Step 2 of 5: Digital Menu & AI Ingestion
              </div>
              <h2 className="text-xl font-bold font-display text-gray-100 mt-1">
                Upload or Build Your Digital Menu
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Customers scan table QR codes to view this menu and place orders in real time.
              </p>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-primary/40 rounded-2xl p-6 bg-primary/5 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">
                  {menuFileName || "Drop physical menu PDF or photos here"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gemini 3.6 Flash automatically extracts item names, categories, and tax rates.
                </p>
              </div>
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-bold text-gray-300 hover:text-primary hover:border-primary transition-all">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setMenuFile(f);
                      setMenuFileName(f.name);
                      dispatch(addToast({ type: "success", title: "File Received", message: `AI analyzing ${f.name}...` }));
                    }
                  }}
                />
              </label>
            </div>

            {/* Quick Add Custom Item */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-300">Quick Add Dish</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Dish name (e.g. Butter Chicken)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary"
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary"
                >
                  <option value="Starters">Starters</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Breads">Breads</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="flex-1 px-3 py-2 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-1 hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                <span>Configured Dishes ({menuItems.length})</span>
                <span className="text-[11px] font-mono text-emerald-400">GST 5% (2.5% CGST + 2.5% SGST)</span>
              </div>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.dietary === "veg" ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <span className="font-bold text-gray-200">{item.name}</span>
                        <span className="text-gray-500 text-[10px] ml-2">({item.category})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary">₹{item.price}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMenuItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl bg-surface border border-surface-border text-gray-300 text-xs font-bold hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-2xl bg-primary text-black font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Proceed to Table & QR Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Tables & Printable QR Generation */}
        {currentStep === 3 && (
          <div className="bg-surface border border-surface-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                Step 3 of 5: Table Provisioning & Live QR Standees
              </div>
              <h2 className="text-xl font-bold font-display text-gray-100 mt-1">
                Configure Tables & Generate Table QRs
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Every table gets an instant, high-resolution QR standee printed with your restaurant’s name: <strong className="text-gray-200">{restaurantName}</strong>.
              </p>
            </div>

            {/* Number of Tables Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300">
                How many tables does {restaurantName} have?
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[4, 8, 12, 16, 24, 32].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setTableCount(num);
                      if (selectedTableForPreview > num) setSelectedTableForPreview(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      tableCount === num
                        ? "bg-primary text-black shadow-md shadow-primary/20"
                        : "bg-surface-subtle text-gray-400 hover:text-gray-200 border border-surface-border"
                    }`}
                  >
                    {num} Tables
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-gray-400">Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tableCount}
                    onChange={(e) => setTableCount(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-surface-border text-xs text-gray-100 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Table Selector & Standee Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Table List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400">Select Table to Preview:</span>
                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {Array.from({ length: tableCount }).map((_, idx) => {
                    const tableNum = idx + 1;
                    const isSelected = selectedTableForPreview === tableNum;
                    return (
                      <button
                        key={tableNum}
                        type="button"
                        onClick={() => setSelectedTableForPreview(tableNum)}
                        className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-surface-subtle border-surface-border text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        Table {tableNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Actual Printable QR Standee Card */}
              <div className="flex flex-col items-center">
                <div className="w-64 p-5 rounded-3xl bg-white text-black shadow-2xl flex flex-col items-center text-center border-4 border-amber-400">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center mb-1">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm font-display tracking-tight text-gray-900 uppercase">
                    {restaurantName}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono">Contactless Smart Table</span>

                  <div className="my-3 p-3 bg-white rounded-2xl border-2 border-gray-200 shadow-inner">
                    <QRCodeSVG
                      value={`http://localhost:3000/t/TBL-${String(selectedTableForPreview).padStart(3, "0")}`}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="px-3 py-1 rounded-full bg-black text-amber-400 font-mono text-xs font-extrabold mb-1">
                    TABLE {String(selectedTableForPreview).padStart(2, "0")}
                  </div>

                  <p className="text-[10px] text-gray-600 font-medium">
                    Point camera to open digital menu & order
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-gray-300 hover:text-primary flex items-center gap-1.5 font-mono"
                >
                  <Printer className="w-3.5 h-3.5" /> Print All {tableCount} Table Cards
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-surface border border-surface-border text-gray-300 text-xs font-bold hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 rounded-2xl bg-primary text-black font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Proceed to Staff Team <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Staff Provisioning & Employee IDs */}
        {currentStep === 4 && (
          <div className="bg-surface border border-surface-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                Step 4 of 5: Operational Staff & Employee IDs
              </div>
              <h2 className="text-xl font-bold font-display text-gray-100 mt-1">
                Add Waiters, Chefs & Cashiers
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Staff members log in via the dedicated Staff Terminal using their auto-generated Employee ID.
              </p>
            </div>

            {/* Quick Add Staff Form */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Add Staff Member</span>
                <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/30">
                  Preview ID: {getNextEmployeeId(newStaffRole)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Rahul)"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary"
                />
                <input
                  type="email"
                  placeholder="Email or Username"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary font-mono"
                />
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary"
                >
                  <option value="WAITER">Waiter (Order Screen)</option>
                  <option value="KITCHEN">Head Chef (KDS)</option>
                  <option value="CASHIER">Cashier (POS Desk)</option>
                  <option value="MANAGER">Floor Manager</option>
                  <option value="GUARD">Security Guard</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddStaff}
                    className="flex-1 px-3 py-2 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-1 hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Staff Roster Table */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400">
                Configured Staff ({staffList.length})
              </span>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                        {staff.employeeId}
                      </span>
                      <div>
                        <span className="font-bold text-gray-100">{staff.name}</span>
                        <span className="text-gray-500 text-[11px] font-mono ml-2">({staff.email})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-surface text-[10px] font-bold text-gray-300 border border-surface-border">
                        {staff.role}
                      </span>
                      <span className="text-gray-500 text-[10px] font-mono hidden sm:inline">
                        Pass: {staff.password}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(staff.id)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl bg-surface border border-surface-border text-gray-300 text-xs font-bold hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-3 rounded-2xl bg-primary text-black font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Review & Launch <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Go-Live */}
        {currentStep === 5 && (
          <div className="bg-surface border border-surface-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                Step 5 of 5: Review & Operational Launch
              </div>
              <h2 className="text-2xl font-extrabold font-display text-gray-100 mt-1">
                Ready to Launch {restaurantName}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Review your configuration below. Tapping Launch activates all real-time waiter terminals, kitchen KDS, and table QR ordering.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Restaurant</span>
                <span className="text-sm font-bold text-gray-100 truncate">{restaurantName}</span>
                <span className="text-[11px] text-gray-500 font-mono">{address}</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Tables & QRs</span>
                <span className="text-sm font-bold text-primary font-mono">{tableCount} Tables</span>
                <span className="text-[11px] text-gray-500">Contactless QR standees ready</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Menu Catalog</span>
                <span className="text-sm font-bold text-amber-400 font-mono">{menuItems.length} Dishes</span>
                <span className="text-[11px] text-gray-500">5% GST rate configured</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col gap-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Staff Crew</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{staffList.length} Operators</span>
                <span className="text-[11px] text-gray-500">Employee IDs assigned</span>
              </div>
            </div>

            {/* Credentials Card for the Owner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-surface-subtle to-surface-subtle border border-amber-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Your Staff Login Credentials
                </h4>
                <span className="text-[11px] text-gray-400 font-mono">Route: /staff/login</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {staffList.slice(0, 3).map((st) => (
                  <div key={st.id} className="p-2.5 rounded-xl bg-surface border border-surface-border text-xs flex flex-col">
                    <span className="text-primary font-mono font-bold text-[10px]">{st.employeeId} ({st.role})</span>
                    <span className="font-bold text-gray-200 truncate mt-0.5">{st.name}</span>
                    <span className="text-gray-400 font-mono text-[10px]">Pass: {st.password}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl bg-surface border border-surface-border text-gray-300 text-xs font-bold hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={handleLaunchRestaurant}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-amber-500 text-black font-extrabold text-sm flex items-center gap-2.5 hover:opacity-95 transition-all shadow-xl shadow-primary/30"
              >
                {isSubmitting ? (
                  <>Launching Operating System...</>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 fill-current" />
                    Launch {restaurantName} Live 🚀
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 font-mono border-t border-surface-border">
        TableOS Commercial Restaurant Platform • High-Concurrency Zero-Join Engine
      </footer>
    </div>
  );
}
