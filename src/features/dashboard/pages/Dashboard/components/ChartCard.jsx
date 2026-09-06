import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

import ScreenContainer from '@components/ScreenContainer';

/**
 * Contenedor común de las cards de charts del dashboard: header (ícono + título +
 * tooltip + subtítulo) y manejo de estados **por card** (loading / error / empty)
 * vía `ScreenContainer`, sin dejar la pantalla entera en blanco.
 */
const ChartCard = ({
  title,
  tooltip,
  icon,
  color = 'blue',
  subtitle,
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  minHeight = 260,
  children,
}) => (
  <Card h="100%">
    <Group gap="xs" mb="md" wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" color={color} size="xl">
        {icon}
      </ThemeIcon>
      <Stack gap={0}>
        <Group gap={4} align="center">
          <Text size="sm" fw={600}>
            {title}
          </Text>
          {tooltip && (
            <Tooltip label={tooltip} withArrow multiline maw={280}>
              <IconInfoCircle
                size={14}
                style={{ color: 'var(--mantine-color-dimmed)' }}
              />
            </Tooltip>
          )}
        </Group>
        {subtitle && (
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        )}
      </Stack>
    </Group>

    <ScreenContainer
      onLoading={{ show: isLoading }}
      onError={{
        show: !isLoading && isError,
        title: 'No se pudo cargar',
        description: 'Ocurrió un error al traer los datos de esta sección.',
        onClick: onRetry,
      }}
      onEmptyData={{
        show: !isLoading && !isError && isEmpty,
        title: 'Sin datos',
        description: 'No hay información para el período y la sucursal seleccionados.',
      }}
      styleProps={{ bg: 'transparent', mih: `${minHeight}px` }}
    >
      {children}
    </ScreenContainer>
  </Card>
);

export default ChartCard;
