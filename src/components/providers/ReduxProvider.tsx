"use client";

import React from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Provider store={store}>
      {children}
      <ToastContainer />
    </Provider>
  );
};
