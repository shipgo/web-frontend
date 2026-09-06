import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useLocation } from "wouter";

import PageFooter from "@components/PageFooter";

import { useVehiculoFormContext } from "../context/VehiculoFormContext";

/**
 * Acciones del formulario de vehículos. Usa el `PageFooter` canónico
 * (`src/app/components`), que renderiza en el slot fijo `AppShell.footer` y le
 * avisa al layout que lo despliegue mientras esté montado (`SHG-FE-036`).
 * Antes era un `<Group>` inline porque el layout sólo mostraba el footer fijo
 * en `ROUTES_WITH_FOOTER = ['/viajes/crear', '/envios/crear']` — esa lista ya
 * no existe. Se conserva el confirm-al-cancelar si hay cambios sin guardar.
 */
const Footer = ({ onSubmit, isSubmitting, submitLabel = "Guardar cambios" }) => {
  const form = useVehiculoFormContext();
  const [, navigate] = useLocation();

  const handleCancel = () => {
    if (!form.isDirty()) {
      navigate("~/vehiculos");
      return;
    }

    modals.openConfirmModal({
      title: "Cancelar",
      children: (
        <Text size="sm">
          Tenés cambios sin guardar. ¿Seguro que querés salir?
        </Text>
      ),
      labels: { confirm: "Sí, cancelar", cancel: "Seguir editando" },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: () => navigate("~/vehiculos"),
    });
  };

  return (
    <PageFooter>
      <Button
        variant="light"
        color="red"
        disabled={isSubmitting}
        onClick={handleCancel}
      >
        Cancelar
      </Button>
      <Button loading={isSubmitting} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </PageFooter>
  );
};

export default Footer;
