import { Group, Paper, Skeleton, Stack, VisuallyHidden } from '@mantine/core';

const CANTIDAD_POR_DEFECTO = 6;

/** Una tarjeta fantasma con la misma estructura que `ListCard` (borde, radio md, padding md, gap xs). */
const ListCardSkeleton = () => (
  // `mih` ≈ alto de una tarjeta real con sus líneas (unos 170 px): el cambio a los datos no estira la lista.
  <Paper withBorder radius="md" p="md" mih={168} data-testid="list-card-skeleton" aria-hidden="true">
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap" align="center">
        <Skeleton circle height={24} />
        <Skeleton height={16} width="55%" />
      </Group>
      <Skeleton height={18} width={72} radius="md" />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="60%" />
    </Stack>
  </Paper>
);

/**
 * Placeholder de la primera carga de un listado de tarjetas (mobile): tarjetas
 * grises del mismo tamaño que las reales, para que al llegar los datos la lista
 * aparezca sin saltos (la tarjeta de "Cargando…" ocupaba ~17 rem y después la
 * página se estiraba de golpe). Anuncia la carga a lectores de pantalla.
 *
 * @param {Object} props
 * @param {string} [props.description] Texto para lectores de pantalla.
 * @param {number} [props.count] Cantidad de tarjetas (6 llenan un celular).
 */
const ListCardsSkeleton = ({ description = 'Cargando...', count = CANTIDAD_POR_DEFECTO }) => (
  <Stack gap="xs" role="status" aria-busy="true" data-testid="list-cards-skeleton">
    <VisuallyHidden>{description}</VisuallyHidden>
    {Array.from({ length: count }, (_, i) => (
      <ListCardSkeleton key={i} />
    ))}
  </Stack>
);

const FILAS_POR_DEFECTO = 8;
const ANCHOS_COLUMNAS = ['22%', '20%', '10%', '12%', '12%'];

/**
 * Placeholder de la primera carga de un listado en formato tabla (escritorio): un
 * encabezado y filas grises de ~59 px (el alto de una fila real), para que al llegar
 * los datos la tabla aparezca sin que el pie con la paginación salte de lugar.
 *
 * @param {Object} props
 * @param {string} [props.description] Texto para lectores de pantalla.
 * @param {number} [props.rows] Cantidad de filas.
 */
export const ListTableSkeleton = ({ description = 'Cargando...', rows = FILAS_POR_DEFECTO }) => (
  <Stack gap={0} role="status" aria-busy="true" data-testid="list-table-skeleton">
    <VisuallyHidden>{description}</VisuallyHidden>
    <Group gap="lg" wrap="nowrap" h={52} px="xs" aria-hidden="true">
      <Skeleton height={20} width={20} radius="sm" />
      {ANCHOS_COLUMNAS.map((ancho, i) => (
        <Skeleton key={i} height={14} width={ancho} />
      ))}
    </Group>
    {Array.from({ length: rows }, (_, i) => (
      <Group
        key={i}
        gap="lg"
        wrap="nowrap"
        h={59}
        px="xs"
        aria-hidden="true"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <Skeleton height={20} width={20} radius="sm" />
        <Group gap="sm" wrap="nowrap" style={{ width: ANCHOS_COLUMNAS[0] }}>
          <Skeleton circle height={36} />
          <Stack gap={6} style={{ flex: 1 }}>
            <Skeleton height={12} width="80%" />
            <Skeleton height={10} width="50%" />
          </Stack>
        </Group>
        {ANCHOS_COLUMNAS.slice(1).map((ancho, j) => (
          <Skeleton key={j} height={12} width={ancho} />
        ))}
      </Group>
    ))}
  </Stack>
);

export default ListCardsSkeleton;
