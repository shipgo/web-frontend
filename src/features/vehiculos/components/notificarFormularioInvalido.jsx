import { IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { FORMULARIO_INVALIDO } from "@copy/common";

/** `onSubmit(handler, handleInvalid)` de `@mantine/form`: avisa el primer error. */
export const notificarFormularioInvalido = (errors) => {
  const firstError = Object.values(errors).find(Boolean);
  notifications.show({
    color: "red",
    title: FORMULARIO_INVALIDO.titulo,
    message: firstError || FORMULARIO_INVALIDO.mensaje,
    icon: <IconX />,
  });
};
