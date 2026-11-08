import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import PageFooter from "@components/PageFooter";
import { useIsMobile } from "@hooks/useIsMobile";
import { FORMULARIO_INVALIDO } from "@copy/common";

import { useFormContext } from "../CrearViaje/contexts/EnviosFormContext";

/**
 * Barra de acciones fija, mismo patrón que `CrearViaje/Footer.jsx`
 * (`PageFooter` → slot `AppShell.footer`). La lógica de guardado (PUT + manejo
 * de errores + navegación) vive en `index.jsx` y llega por `onSubmit`.
 */
const Footer = ({ loading, onSubmit, onCancel, guardarDeshabilitado = false }) => {
  const isMobile = useIsMobile();
  const form = useFormContext();

  const handleInvalid = (errors) => {
    const firstError = Object.values(errors)[0];
    notifications.show({
      color: "red",
      title: FORMULARIO_INVALIDO.titulo,
      message:
        firstError || FORMULARIO_INVALIDO.mensaje,
      icon: <IconX />,
    });
  };

  return (
    <PageFooter>
      <Button color="red" variant="light" mih={isMobile ? 44 : undefined} disabled={loading} onClick={onCancel}>
        Cancelar
      </Button>
      <Button
        mih={isMobile ? 44 : undefined}
        loading={loading}
        disabled={guardarDeshabilitado}
        onClick={() => form.onSubmit(onSubmit, handleInvalid)()}
      >
        Guardar cambios
      </Button>
    </PageFooter>
  );
};

export default Footer;
