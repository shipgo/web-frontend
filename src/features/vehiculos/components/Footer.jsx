import { Button, Group, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useLocation } from "wouter";

import { useVehiculoFormContext } from "../context/VehiculoFormContext";

/**
 * Acciones del formulario de vehículos. Mismo criterio visual que el `Footer`
 * compartido de `CrearEnvios` / `CrearViaje` (cancelar `variant="light"
 * color="red"` con confirmación si hay cambios sin guardar + submit primario),
 * pero renderizado inline en vez de `AppShellFooter`: el `Layout` de la app
 * (`src/app/layout`, fuera del alcance de esta tarea) sólo desplaza el footer
 * fijo para las rutas `/envios/crear` y `/viajes/crear`, así que en
 * `/vehiculos/*` un `AppShellFooter` quedaría colapsado. Ver bitácora de
 * `SHG-FE-034`.
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
    <Group justify="flex-end" gap="xs" mt="md">
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
    </Group>
  );
};

export default Footer;
