import { Link } from "wouter";
import {
  Box,
  Breadcrumbs,
  Button,
  Flex,
  Group,
  Text,
  Title,
} from "@mantine/core";

const HELP_URL = "https://shipgo.gitbook.io/manual";

/**
 * Header canónico de las pantallas de formulario y de detalle en todo el sistema
 * (referencia: `CrearViaje` / `CrearEnvios`): breadcrumbs `Entidad / Acción` como
 * título de la página + bajada opcional + botón "Necesito ayuda". Compartido por
 * crear/editar/detalle de cada entidad para que el patrón no diverja.
 *
 * `entidadHref` es relativo al router anidado de la feature (`/viajes`, `/envios`,
 * ...), igual que en las pantallas canónicas — por defecto `"/"`, que resuelve al
 * listado de la entidad.
 *
 * @param {Object} props
 * @param {string} props.entidad - primer segmento del breadcrumb (ej: "Envíos").
 * @param {string} [props.entidadHref] - href del segmento entidad (default "/").
 * @param {string} props.accion - segmento final / título de la pantalla.
 * @param {string | import('react').ReactNode} [props.descripcion] - texto dimmed
 *   bajo el título, o un nodo propio (ej: badge de estado + código).
 * @param {import('react').ReactNode} [props.children] - acciones extra a la
 *   izquierda del botón "Necesito ayuda" (ej: "Editar", "Entregar").
 */
const PageBreadcrumbsHeader = ({
  entidad,
  entidadHref = "/",
  accion,
  descripcion,
  children,
}) => (
  <Flex align="flex-end" gap="xs">
    <Box>
      <Breadcrumbs separatorMargin="sm" separator={<Title order={3}>/</Title>}>
        <Link href={entidadHref} asChild>
          <Title
            order={2}
            style={{ cursor: "pointer" }}
            c="var(--mantine-color-colorPalette-light-color)"
          >
            {entidad}
          </Title>
        </Link>
        <Title order={2}>{accion}</Title>
      </Breadcrumbs>
      {typeof descripcion === "string" ? (
        <Text c="dimmed">{descripcion}</Text>
      ) : (
        descripcion
      )}
    </Box>

    <Group ml="auto" gap="xs">
      {children}
      <Button variant="subtle" component="a" href={HELP_URL} target="_blank">
        Necesito ayuda
      </Button>
    </Group>
  </Flex>
);

export default PageBreadcrumbsHeader;
