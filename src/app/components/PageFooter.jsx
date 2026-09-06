import { AppShellFooter, Flex } from "@mantine/core";

import { useRegisterFooterSlot } from "../layout/footerSlot";

/**
 * Barra de acciones fija (Cancelar + submit, con badges/resumen opcionales)
 * para las pantallas de crear/editar. Renderiza en el slot `AppShell.footer`
 * vía `AppShellFooter` y, mientras está montada, le avisa al layout que hay
 * footer (`useRegisterFooterSlot`) para que despliegue ese slot — reemplaza la
 * lista `ROUTES_WITH_FOOTER` hardcodeada de `src/app/layout/index.jsx`
 * (`SHG-FE-036`).
 *
 * El contenido va como `children`, alineado a la derecha dentro del contenedor
 * de ancho máximo 1440px. Para anteponer badges/resúmenes a la izquierda, poné
 * `mr="auto"` en el primer hijo (mismo patrón que ya usaban
 * `CrearEnvios`/`CrearViaje`).
 */
const PageFooter = ({ children }) => {
  useRegisterFooterSlot();

  return (
    <AppShellFooter component={Flex} justify="center">
      <Flex
        flex={1}
        maw={1440}
        px="xl"
        py="xs"
        justify="flex-end"
        align="center"
        gap="xs"
      >
        {children}
      </Flex>
    </AppShellFooter>
  );
};

export default PageFooter;
