"use client";

import React, { createContext, useContext, useRef } from "react";
import { usePathname } from "next/navigation";

// Define the order of routes to determine slide direction
const routeOrder = [
  "/dashboard",
  "/transactions",
  "/chat",
  "/goals",
  "/credit",
];

const NavigationContext = createContext({ direction: 1 });

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = React.useState({ path: pathname, direction: 1 });

  // Deriving state from props (pathname) synchronously during render
  if (pathname !== state.path) {
    const prevIndex = routeOrder.findIndex(r => state.path.startsWith(r));
    const currIndex = routeOrder.findIndex(r => pathname.startsWith(r));
    
    let newDirection = state.direction;
    if (currIndex !== -1 && prevIndex !== -1) {
      newDirection = currIndex > prevIndex ? 1 : -1;
    }
    
    setState({ path: pathname, direction: newDirection });
  }

  return (
    <NavigationContext.Provider value={{ direction: state.direction }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavDirection = () => useContext(NavigationContext);
