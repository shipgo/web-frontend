import { useState } from "react";

import { SelectedViajeContext } from "../contexts/selectedViaje";

const SelectedViajeProvider = ({ children }) => {
  const [selectedViajeId, setSelectedViajeId] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState('todas');

  return (
    <SelectedViajeContext.Provider
      value={{ selectedViajeId, setSelectedViajeId, selectedSucursal, setSelectedSucursal }}
    >
      {children}
    </SelectedViajeContext.Provider>
  );
};

export default SelectedViajeProvider;
