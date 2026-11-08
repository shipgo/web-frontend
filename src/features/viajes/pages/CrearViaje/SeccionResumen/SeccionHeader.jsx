import {
  Alert,
  Box,
  Button,
  Group,
  Switch,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useIsMobile } from "@hooks/useIsMobile";
import { IconFileDescription, IconAlertTriangle } from "@tabler/icons-react";

const SeccionHeader = ({
  returnOrigin,
  onReturnOriginChange,
  canCalculateNewRoute,
  showAlert,
  isPending,
  onRouteCalculation,
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      <Group gap="0.75rem" wrap={isMobile ? "wrap" : undefined}>
        <ThemeIcon size="xl" variant="light">
          <IconFileDescription />
        </ThemeIcon>

        <Box>
          <Title order={4}>Resumen del viaje</Title>
          <Text c="dimmed" size="sm">
            Revisá los datos del viaje antes de finalizar.
          </Text>
        </Box>

        <Switch
          ml={isMobile ? undefined : "auto"}
          size={isMobile ? "md" : undefined}
          label="Volver a la sucursal de origen al final"
          checked={returnOrigin}
          disabled={isPending}
          onChange={(event) =>
            onReturnOriginChange(event.currentTarget.checked)
          }
        />

        <Tooltip
          multiline
          w={250}
          events={{ hover: !canCalculateNewRoute && !isPending }}
          label="La ruta ya está actualizada."
        >
          {/* `c="var(--shg-button-text-primary)"`: ver ese token en
              `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto del
              color primario en `variant="light"` no llega a 4.5:1 en dark
              mode (axe-core `color-contrast`, SHG-FE-070). */}
          <Button
            variant="light"
            mih={isMobile ? 44 : undefined}
            onClick={onRouteCalculation}
            disabled={!canCalculateNewRoute}
            loading={isPending}
            c="var(--shg-button-text-primary)"
          >
            Calcular ruta
          </Button>
        </Tooltip>
      </Group>

      {showAlert && (
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle />}>
          Cambiaste los envíos: volvé a calcular la ruta.
        </Alert>
      )}
    </>
  );
};

export default SeccionHeader;
