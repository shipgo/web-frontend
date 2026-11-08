import { Link } from 'wouter';
import {
  ActionIcon,
  Box,
  Breadcrumbs,
  Flex,
  Group,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

import { useIsMobile } from '@hooks/useIsMobile';
import PageHeaderActions from './PageHeaderActions';

/**
 * Header canónico de las pantallas de formulario y de detalle en todo el sistema
 * (referencia: `CrearViaje` / `CrearEnvios`): breadcrumbs `Entidad / Acción` como
 * título de la página + bajada opcional + botón "Ayuda". Compartido por
 * crear/editar/detalle de cada entidad para que el patrón no diverja.
 *
 * `entidadHref` es relativo al router anidado de la feature (`/viajes`, `/envios`,
 * ...), igual que en las pantallas canónicas — por defecto `"/"`, que resuelve al
 * listado de la entidad.
 *
 * Mobile (< sm): el breadcrumb se reduce a flecha "volver" (a `entidadHref`) +
 * título (`accion`) de una línea con truncado; `primaryAction` pasa a botón de
 * ícono y `secondaryActions` + "Ayuda" a un menú de tres puntos.
 *
 * @param {Object} props
 * @param {string} props.entidad - primer segmento del breadcrumb (ej: "Envíos").
 * @param {string} [props.entidadHref] - href del segmento entidad (default "/").
 * @param {string} props.accion - segmento final / título de la pantalla.
 * @param {string | import('react').ReactNode} [props.descripcion] - texto dimmed
 *   bajo el título, o un nodo propio (ej: badge de estado + código).
 * @param {import('react').ReactNode} [props.children] - acciones extra a la
 *   izquierda del botón "Ayuda" (ej: "Editar", "Entregar").
 * @param {{label: string, icon?: import('react').ReactNode, onClick?: Function}} [props.primaryAction]
 *   acción principal (Button en escritorio, ActionIcon con aria-label en mobile).
 * @param {Array<{label: string, icon?: import('react').ReactNode, onClick?: Function}>} [props.secondaryActions]
 *   acciones secundarias (botones subtle en escritorio, menú de tres puntos en mobile).
 */
const PageBreadcrumbsHeader = ({
  entidad,
  entidadHref = '/',
  accion,
  descripcion,
  children,
  primaryAction,
  secondaryActions,
}) => {
  const isMobile = useIsMobile();

  const descripcionNode =
    typeof descripcion === 'string' ? <Text c="dimmed">{descripcion}</Text> : descripcion;

  if (isMobile) {
    return (
      <Flex align="center" gap="xs" wrap="nowrap">
        <Link href={entidadHref} asChild>
          <ActionIcon
            component="a"
            variant="subtle"
            size={44}
            aria-label={`Volver a ${entidad}`}
          >
            <IconArrowLeft size={22} />
          </ActionIcon>
        </Link>
        <Box flex={1} miw={0}>
          <Title order={2} truncate="end">
            {accion}
          </Title>
          {descripcionNode}
        </Box>
        <Group gap="xs" wrap="nowrap">
          <PageHeaderActions primaryAction={primaryAction} secondaryActions={secondaryActions}>
            {children}
          </PageHeaderActions>
        </Group>
      </Flex>
    );
  }

  return (
    <Flex align="flex-end" gap="xs">
      <Box>
        <Breadcrumbs separatorMargin="sm" separator={<Title order={3}>/</Title>}>
          <Link href={entidadHref} asChild>
            <Title
              order={2}
              style={{ cursor: 'pointer' }}
              c="var(--mantine-color-colorPalette-light-color)"
            >
              {entidad}
            </Title>
          </Link>
          <Title order={2}>{accion}</Title>
        </Breadcrumbs>
        {descripcionNode}
      </Box>

      <Group ml="auto" gap="xs">
        <PageHeaderActions primaryAction={primaryAction} secondaryActions={secondaryActions}>
          {children}
        </PageHeaderActions>
      </Group>
    </Flex>
  );
};

export default PageBreadcrumbsHeader;
