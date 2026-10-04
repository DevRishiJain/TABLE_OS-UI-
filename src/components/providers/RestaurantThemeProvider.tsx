"use client";

import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setRestaurantTheme } from "@/store/slices/authSlice";

export type RestaurantTheme =
  | ""
  | "jade"
  | "scarlet"
  | "violet"
  | "cobalt"
  | "rose"
  | "gold"
  | "amber"
  | "emerald"
  | "ruby"
  | "amethyst"
  | "sapphire"
  | "coral";

export type ThemeKey = RestaurantTheme;
export type ColorMode = "dark" | "light";

export interface ThemeOption {
  id: RestaurantTheme;
  key: RestaurantTheme;
  name: string;
  primaryColor: string;
  hoverColor: string;
  description: string;
}

export function normalizeTheme(t?: string | null): string {
  if (!t) return "";
  const map: Record<string, string> = {
    gold: "",
    amber: "",
    "": "",
    emerald: "jade",
    jade: "jade",
    ruby: "scarlet",
    scarlet: "scarlet",
    amethyst: "violet",
    violet: "violet",
    sapphire: "cobalt",
    cobalt: "cobalt",
    coral: "rose",
    rose: "rose",
  };
  return map[t] !== undefined ? map[t] : "";
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "",
    key: "",
    name: "Imperial Amber",
    primaryColor: "#E9B24C",
    hoverColor: "#D4562C",
    description: "Signature TableOS warm luxury aesthetic",
  },
  {
    id: "jade",
    key: "jade",
    name: "Botanical Jade",
    primaryColor: "#4BD6A0",
    hoverColor: "#0F8F73",
    description: "Lush, fresh organic dining & bistro vibe",
  },
  {
    id: "scarlet",
    key: "scarlet",
    name: "Crimson Scarlet",
    primaryColor: "#FF6A5C",
    hoverColor: "#C21F3A",
    description: "Bold, passionate bar & steakhouse theme",
  },
  {
    id: "violet",
    key: "violet",
    name: "Velvet Violet",
    primaryColor: "#B79CFF",
    hoverColor: "#7A3CF0",
    description: "Contemporary lounge & nightlife elegance",
  },
  {
    id: "cobalt",
    key: "cobalt",
    name: "Ocean Cobalt",
    primaryColor: "#5CCBFF",
    hoverColor: "#2B6BFF",
    description: "Modern coastal cafe & refreshing atmosphere",
  },
  {
    id: "rose",
    key: "rose",
    name: "Sunset Rose",
    primaryColor: "#FF8FB0",
    hoverColor: "#E0356A",
    description: "Chic dessert bar, bakery & cocktail house",
  },
];

export interface ThemeContextType {
  currentTheme: string;
  colorMode: ColorMode;
  themePrimaryColor: string;
  themeHoverColor: string;
  setTheme: (theme: string) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "",
  colorMode: "dark",
  themePrimaryColor: "#E9B24C",
  themeHoverColor: "#D4562C",
  setTheme: () => {},
  setColorMode: () => {},
  toggleColorMode: () => {},
  isMounted: false,
});

export const useRestaurantTheme = () => useContext(ThemeContext);
export const useTheme = useRestaurantTheme;

export function RestaurantThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const storeTheme = useAppSelector((state) => state.auth.restaurantTheme);

  const [currentTheme, setCurrentThemeState] = useState<string>("");
  const [colorMode, setColorModeState] = useState<ColorMode>("light");
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize theme attribute on HTML root element
  const applyThemeToDOM = useCallback((theme: string) => {
    if (typeof document === "undefined") return;
    const normalized = normalizeTheme(theme);
    if (normalized) {
      document.documentElement.setAttribute("data-theme", normalized);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  // Synchronize color mode on HTML root
  const applyColorModeToDOM = useCallback((mode: ColorMode) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-mode", mode);
    if (mode === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Update theme with immediate state change and persistence
  const setTheme = useCallback(
    (theme: string) => {
      const normalized = normalizeTheme(theme);
      setCurrentThemeState(normalized);
      applyThemeToDOM(normalized);
      dispatch(setRestaurantTheme(normalized));
      if (typeof window !== "undefined") {
        if (normalized) {
          localStorage.setItem("tableos-theme", normalized);
          localStorage.setItem("tableos_restaurant_theme", normalized);
        } else {
          localStorage.removeItem("tableos-theme");
          localStorage.removeItem("tableos_restaurant_theme");
        }
      }
    },
    [dispatch, applyThemeToDOM]
  );

  // Update color mode
  const setColorMode = useCallback(
    (mode: ColorMode) => {
      setColorModeState(mode);
      applyColorModeToDOM(mode);
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_color_mode", mode);
      }
    },
    [applyColorModeToDOM]
  );

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => {
      const nextMode = prev === "dark" ? "light" : "dark";
      applyColorModeToDOM(nextMode);
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_color_mode", nextMode);
      }
      return nextMode;
    });
  }, [applyColorModeToDOM]);

  // Initial client mount effect: sync from DOM attribute or localStorage
  useEffect(() => {
    setIsMounted(true);
    const fromAttr = typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") : null;
    const savedTheme =
      (typeof window !== "undefined" ? localStorage.getItem("tableos-theme") : null) ||
      fromAttr ||
      (typeof window !== "undefined" ? localStorage.getItem("tableos_restaurant_theme") : null) ||
      storeTheme ||
      "";
    const savedMode = (typeof window !== "undefined" ? (localStorage.getItem("tableos_color_mode") as ColorMode) : null) || "light";

    const normalized = normalizeTheme(savedTheme);
    setCurrentThemeState(normalized);
    setColorModeState(savedMode);
    applyThemeToDOM(normalized);
    applyColorModeToDOM(savedMode);
  }, [storeTheme, applyThemeToDOM, applyColorModeToDOM]);

  // Keep in sync if Redux store changes externally
  useEffect(() => {
    if (storeTheme !== undefined && storeTheme !== null) {
      const normalized = normalizeTheme(storeTheme);
      if (normalized !== currentTheme) {
        setCurrentThemeState(normalized);
        applyThemeToDOM(normalized);
      }
    }
  }, [storeTheme, currentTheme, applyThemeToDOM]);

  const activeOption =
    THEME_OPTIONS.find((t) => t.id === currentTheme || t.key === currentTheme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        colorMode,
        themePrimaryColor: activeOption.primaryColor,
        themeHoverColor: activeOption.hoverColor,
        setTheme,
        setColorMode,
        toggleColorMode,
        isMounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
