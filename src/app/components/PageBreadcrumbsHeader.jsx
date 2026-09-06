import { Link } from "wouter";
import { Box, Breadcrumbs, Button, Flex, Text, Title } from "@mantine/core";

const HELP_URL = "https://shipgo.gitbook.io/manual";

/**
 * Header canónico de las pantallas de formulario y de detalle (referencia:
 * `CrearViaje` / `CrearEnvios`): breadcrumbs `Entidad / Acción` como título de
 * la página + bajada opcional + botón "Necesito ayuda".
 *
 * `entidadHref` es relativo al router anidado de la feature (`/viajes`,
 * `/envios`, ...), igual que en las pantallas canónicas — por defecto `"/"`,
 * que resuelve al listado de la entidad.
 *
 * @param {{
 *   entidad: string,
 *   entidadHref?: string,
 *   accion: string,
 *   descripcion?: string,
 * }} props
 */
const PageBreadcrumbsHeader = ({
  entidad,
  entidadHref = "/",
  accion,
  descripcion,
}) => (
  <Flex align="flex-end" gap="xs">
    <Box>
      <Breadcrumbs
        separatorMargin="sm"
        separator={<Title order={3}>/</Title>}
      >
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
      {descripcion && <Text c="dimmed">{descripcion}</Text>}
    </Box>

    <Button
      variant="subtle"
      ml="auto"
      component="a"
      href={HELP_URL}
      target="_blank"
    >
      Necesito ayuda
    </Button>
  </Flex>
);

export default PageBreadcrumbsHeader;
