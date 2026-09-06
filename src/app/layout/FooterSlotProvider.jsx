import { useCallback, useMemo, useState } from "react";

import { FooterSlotContext } from "./footerSlot";

/**
 * Provee el estado del slot `AppShell.footer` (ver `footerSlot.js` /
 * `SHG-FE-036`). Se usa un contador (no un booleano) para tolerar el
 * solapamiento breve de montaje/desmontaje al navegar entre dos pantallas con
 * footer y el doble-invoke de efectos de React StrictMode.
 */
const FooterSlotProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const register = useCallback(() => {
    setCount((current) => current + 1);
    return () => setCount((current) => Math.max(0, current - 1));
  }, []);

  const value = useMemo(
    () => ({ hasFooter: count > 0, register }),
    [count, register],
  );

  return (
    <FooterSlotContext.Provider value={value}>
      {children}
    </FooterSlotContext.Provider>
  );
};

export default FooterSlotProvider;
