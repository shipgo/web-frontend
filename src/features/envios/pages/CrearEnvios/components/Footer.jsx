import { Badge, Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useLocation } from "wouter";

import PageFooter from "@components/PageFooter";

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

const Footer = ({ onSubmit, isSubmitting, submitLabel = "Registrar envío" }) => {
  const form = useEnvioFormContext();
  const [, navigate] = useLocation();
  const { nombre, apellido, detalleEnvios } = form.values;

  const handleCancel = () => {
    if (!form.isDirty()) {
      navigate("~/envios");
      return;
    }
    modals.openConfirmModal({
      title: "Cancelar envío",
      children: (
        <Text size="sm">
          Tenés cambios sin guardar. ¿Seguro que querés salir?
        </Text>
      ),
      labels: { confirm: "Sí, cancelar", cancel: "Seguir editando" },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: () => navigate("~/envios"),
    });
  };

  const nombreDestinatario = `${nombre ?? ""} ${apellido ?? ""}`.trim();
  const totalBultos = detalleEnvios.length;
  const totalPeso = detalleEnvios.reduce(
    (sum, p) => sum + (Number(p.peso) || 0),
    0,
  );

  return (
    <PageFooter>
      {nombreDestinatario && (
        <Badge variant="dot" color="blue">
          {nombreDestinatario}
        </Badge>
      )}
      {totalBultos > 0 && (
        <Badge variant="dot" color="violet">
          {totalBultos} {totalBultos === 1 ? "bulto" : "bultos"}
        </Badge>
      )}
      {totalPeso > 0 && (
        <Badge variant="dot" color="orange">
          {totalPeso} kg
        </Badge>
      )}
      <Button
        variant="light"
        color="red"
        disabled={isSubmitting}
        ml="auto"
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
