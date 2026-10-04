"use client";

import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setRestaurantTheme } from "@/store/slices/authSlice";

export type RestaurantTheme = "gold" | "emerald" | "ruby" | "amethyst" | "sapphire" | "coral";
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

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "gold",
    key: "gold",
    name: "Imperial Amber",
    primaryColor: "#E5A93C",
    hoverColor: "#D4982E",
    description: "Signature TableOS warm luxury aesthetic",
  },
  {
    id: "emerald",
    key: "emerald",
    name: "Botanical Jade",
    primaryColor: "#10B981",
    hoverColor: "#059669",
    description: "Lush, fresh organic dining & bistro vibe",
  },
  {
    id: "ruby",
    key: "ruby",
    name: "Crimson Scarlet",
    primaryColor: "#EF4444",
    hoverColor: "#DC2626",
    description: "Bold, passionate bar & steakhouse theme",
  },
  {
    id: "amethyst",
    key: "amethyst",
    name: "Velvet Violet",
    primaryColor: "#8B5CF6",
    hoverColor: "#7C3AED",
    description: "Contemporary lounge & nightlife elegance",
  },
  {
    id: "sapphire",
    key: "sapphire",
    name: "Ocean Cobalt",
    primaryColor: "#06B6D4",
    hoverColor: "#0891B2",
    description: "Modern coastal cafe & refreshing atmosphere",
  },
  {
    id: "coral",
    key: "coral",
    name: "Sunset Rose",
    primaryColor: "#F43F5E",
    hoverColor: "#E11D48",
    description: "Chic dessert bar, bakery & cocktail house",
  },
];

export interface ThemeContextType {
  currentTheme: RestaurantTheme;
  colorMode: ColorMode;
  themePrimaryColor: string;
  themeHoverColor: string;
  setTheme: (theme: RestaurantTheme) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "gold",
  colorMode: "dark",
  themePrimaryColor: "#E5A93C",
  themeHoverColor: "#D4982E",
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

  const [currentTheme, setCurrentThemeState] = useState<RestaurantTheme>("gold");
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize theme attribute and CSS variables on HTML root
  const applyThemeToDOM = useCallback((theme: string) => {
    if (typeof document === "undefined") return;
    const option =
      THEME_OPTIONS.find((t) => t.id === theme || t.key === theme) || THEME_OPTIONS[0];
    document.documentElement.setAttribute("data-theme", option.id);
    document.documentElement.style.setProperty("--theme-primary", option.primaryColor);
    document.documentElement.style.setProperty("--theme-primary-hover", option.hoverColor);
    document.documentElement.style.setProperty("--theme-primary-dark", option.hoverColor);

    const hex = option.primaryColor.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Space-separated for Tailwind rgb(var(--theme-primary-rgb) / <alpha-value>)
      document.documentElement.style.setProperty("--theme-primary-rgb", `${r} ${g} ${b}`);
      document.documentElement.style.setProperty(
        "--theme-primary-glow",
        `rgba(${r}, ${g}, ${b}, 0.25)`
      );
    }
  }, []);

  // Synchronize color mode on HTML root
  const applyColorModeToDOM = useCallback((mode: ColorMode) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-mode", mode);
    if (mode === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  // Update theme with immediate state change and persistence
  const setTheme = useCallback(
    (theme: RestaurantTheme) => {
      const validTheme = THEME_OPTIONS.some((t) => t.id === theme) ? theme : "gold";
      setCurrentThemeState(validTheme);
      applyThemeToDOM(validTheme);
      dispatch(setRestaurantTheme(validTheme));
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_restaurant_theme", validTheme);
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

  // Initial client mount effect
  useEffect(() => {
    setIsMounted(true);
    const savedTheme =
      (localStorage.getItem("tableos_restaurant_theme") as RestaurantTheme) ||
      (storeTheme as RestaurantTheme) ||
      "gold";
    const savedMode = (localStorage.getItem("tableos_color_mode") as ColorMode) || "dark";

    setCurrentThemeState(savedTheme);
    setColorModeState(savedMode);
    applyThemeToDOM(savedTheme);
    applyColorModeToDOM(savedMode);
  }, [storeTheme, applyThemeToDOM, applyColorModeToDOM]);

  // Keep in sync if Redux store changes externally
  useEffect(() => {
    if (storeTheme && storeTheme !== currentTheme) {
      setCurrentThemeState(storeTheme as RestaurantTheme);
      applyThemeToDOM(storeTheme);
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
