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
import { IconFileDescription, IconAlertTriangle } from "@tabler/icons-react";

const SeccionHeader = ({
  returnOrigin,
  onReturnOriginChange,
  canCalculateNewRoute,
  showAlert,
  isPending,
  onRouteCalculation,
}) => {
  return (
    <>
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconFileDescription />
        </ThemeIcon>

        <Box>
          <Title order={4}>Resumen del viaje</Title>
          <Text c="dimmed" size="sm">
            Revisa los datos del viaje antes de finalizar
          </Text>
        </Box>

        <Switch
          ml="auto"
          label="Retornar a sucursal de origen"
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
          label="La ruta calculada es válida para los paquetes seleccionados y la opción de retorno actual"
        >
          <Button
            variant="light"
            onClick={onRouteCalculation}
            disabled={!canCalculateNewRoute}
            loading={isPending}
          >
            Calcular trayecto sugerido
          </Button>
        </Tooltip>
      </Group>

      {showAlert && (
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle />}>
          Modificaste los paquetes seleccionados por lo que la ruta mostrada
          está desactualizada.
        </Alert>
      )}
    </>
  );
};

export default SeccionHeader;
