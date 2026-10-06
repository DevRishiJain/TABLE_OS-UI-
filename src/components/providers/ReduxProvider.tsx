"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { initWebSocketBridge } from "@/lib/wsBridge";
import { wsClient } from "@/lib/ws";

function WebSocketInitializer() {
  useEffect(() => {
    initWebSocketBridge(store.dispatch);
    wsClient.connect();
  }, []);
  return null;
}

export const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Provider store={store}>
      <WebSocketInitializer />
      {children}
      <ToastContainer />
    </Provider>
  );
};

