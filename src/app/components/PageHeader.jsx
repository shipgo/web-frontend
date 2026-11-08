import { Flex, Group, Stack, Text, Title } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';
import PageHeaderActions from './PageHeaderActions';

/**
 * Encabezado de listados.
 *
 * Props actuales (sin cambios): `title`, `subtitle`, `children` (acciones).
 * Props nuevas, opcionales, pensadas para mobile:
 * - `primaryAction`: `{ label, icon, onClick | component/to/href }`. En escritorio
 *   es un Button con texto; en mobile un botón de ícono (`aria-label = label`).
 * - `secondaryActions`: `[{ label, icon, onClick, loading, disabled }]` (ej.
 *   "Exportar CSV"). Escritorio: botones subtle; mobile: menú de tres puntos
 *   junto con "Ayuda".
 * `children` se sigue renderizando igual (retrocompatible); migrar una pantalla
 * es mover sus botones a `primaryAction`/`secondaryActions`.
 * En mobile el título es de UNA línea con truncado.
 */
const PageHeader = ({ title, subtitle, children, primaryAction, secondaryActions }) => {
  const isMobile = useIsMobile();

  return (
    <Flex justify="space-between" gap="xs" align={isMobile ? 'center' : 'flex-end'} wrap="nowrap">
      <Stack gap={0} miw={0} flex={isMobile ? 1 : undefined}>
        {/* `Title` no resuelve `truncate`: una sola línea con puntos suspensivos a mano (mobile). */}
        <Title
          order={2}
          fz={isMobile ? 24 : undefined}
          style={
            isMobile
              ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
              : undefined
          }
        >
          {title}
        </Title>
        {subtitle && (
          <Text c="dimmed" truncate={isMobile ? 'end' : undefined}>
            {subtitle}
          </Text>
        )}
      </Stack>
      <Group gap="xs" wrap="nowrap">
        <PageHeaderActions primaryAction={primaryAction} secondaryActions={secondaryActions}>
          {children}
        </PageHeaderActions>
      </Group>
    </Flex>
  );
};

export default PageHeader;
