import { createContext, useContext } from "react";

export const SelectedViajeContext = createContext();

export const useSelectedViaje = () => {
  const context = useContext(SelectedViajeContext);

  if (!context) {
    throw new Error(
      "useSelectedViaje must be used within a SelectedViajeProvider"
    );
  }

  return context;
};
