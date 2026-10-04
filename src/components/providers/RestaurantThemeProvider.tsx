"use client";

import React, { useEffect, createContext, useContext } from "react";
import { useAppSelector } from "@/store";

export type RestaurantTheme = "gold" | "emerald" | "ruby" | "amethyst" | "sapphire" | "coral";
export type ThemeKey = RestaurantTheme;

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

interface ThemeContextType {
  currentTheme: RestaurantTheme;
  setTheme: (theme: RestaurantTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "gold",
  setTheme: () => {},
});

export const useRestaurantTheme = () => useContext(ThemeContext);
export const useTheme = useRestaurantTheme;

export function RestaurantThemeProvider({ children }: { children: React.ReactNode }) {
  const storeTheme = useAppSelector((state) => state.auth.restaurantTheme);

  const applyTheme = (theme: string) => {
    if (typeof document !== "undefined") {
      const validTheme = THEME_OPTIONS.some((t) => t.id === theme) ? theme : "gold";
      document.documentElement.setAttribute("data-theme", validTheme);
      localStorage.setItem("tableos_restaurant_theme", validTheme);
    }
  };

  useEffect(() => {
    const savedTheme = storeTheme || localStorage.getItem("tableos_restaurant_theme") || "gold";
    applyTheme(savedTheme);
  }, [storeTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: (storeTheme as RestaurantTheme) || "gold",
        setTheme: applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
