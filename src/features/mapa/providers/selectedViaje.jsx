import { useState } from "react";

import { SelectedViajeContext } from "../contexts/selectedViaje";

const SelectedViajeProvider = ({ children }) => {
  const [selectedViajeId, setSelectedViajeId] = useState(null);

  return (
    <SelectedViajeContext.Provider
      value={{ selectedViajeId, setSelectedViajeId }}
    >
      {children}
    </SelectedViajeContext.Provider>
  );
};

export default SelectedViajeProvider;
