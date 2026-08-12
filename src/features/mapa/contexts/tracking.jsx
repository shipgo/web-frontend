import { createContext, useContext } from "react";

export const TrackingContext = createContext();

export const useTracking = () => {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }

  return context;
};
