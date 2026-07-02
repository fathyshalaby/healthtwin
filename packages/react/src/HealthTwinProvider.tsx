import * as React from "react";
import type { LocalStore } from "@healthtwin/core";

export interface HealthTwinContextValue {
  store: LocalStore;
  subjectId: string;
  origin: string;
}

export const HealthTwinContext = React.createContext<HealthTwinContextValue | null>(null);

export const HealthTwinProvider: React.FC<{
  store: LocalStore;
  subjectId: string;
  origin: string;
  children: React.ReactNode;
}> = ({ store, subjectId, origin, children }) => (
  <HealthTwinContext.Provider value={{ store, subjectId, origin }}>
    {children}
  </HealthTwinContext.Provider>
);
