import { useLocation } from "wouter";
import { Badge, Button, Card, Stack, Text } from "@mantine/core";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { estadoBadge } from "@domain/estados";

/**
 * Pantalla que reemplaza al form cuando el envío está en un estado terminal
 * (`entregado`/`rechazado`, `esEstadoTerminal` de `@domain/estados`): la máquina
 * de estados del backend ya no permite modificarlo, así que se bloquea la
 * edición entera en vez de dejar que el `PUT` falle (`SHG-FE-004`). Mantiene el
 * header canónico de `SHG-FE-031`.
 *
 * @param {Object} props
 * @param {string} props.estado - estado actual del envío.
 */
const EnvioNoEditable = ({ estado }) => {
  const [, navigate] = useLocation();
  const { label, color, textColor } = estadoBadge("envio", estado);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Envíos"
        accion="Editar envío"
        descripcion="Este envío no se puede editar en su estado actual"
      />

      <Card withBorder>
        <Stack align="center" py="xl" gap="sm">
          {/* `c={textColor}`: ver `BADGE_TEXT_CONTRAST_OVERRIDE` en
              `@domain/estados` — sin esto, "Entregado" no llega a 4.5:1
              (axe-core `color-contrast`, SHG-FE-041). `undefined` para el
              resto de los estados, sin efecto. */}
          <Badge color={color} size="lg" c={textColor}>
            {label}
          </Badge>
          <Text c="dimmed" ta="center">
            No se pueden editar envíos en estado &quot;Entregado&quot; o
            &quot;Rechazado&quot;.
          </Text>
          <Button onClick={() => navigate("~/envios")}>Volver a Envíos</Button>
        </Stack>
      </Card>
    </PageContainer>
  );
};

export default EnvioNoEditable;
