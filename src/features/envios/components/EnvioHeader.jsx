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

const AYUDA_URL = "https://shipgo.gitbook.io/manual";

/**
 * Header canónico de las pantallas de Envíos (`CrearEnvios` es la referencia,
 * ver `SHG-FE-031`): breadcrumbs `Envíos / <accion>`, una línea de descripción
 * y un botón "Necesito ayuda" al manual. Compartido por `CrearEnvios`,
 * `EditarEnvio` y `DetalleEnvio` para que el patrón no diverja entre ellas.
 *
 * @param {Object} props
 * @param {string} props.accion - segmento final del breadcrumb / título de la
 *   pantalla (ej: "Crear nuevo envío", "Editar envío", "Detalle de envío").
 * @param {string | import('react').ReactNode} [props.descripcion] - texto
 *   dimmed bajo el título, o un nodo propio (ej: badge de estado + código).
 * @param {import('react').ReactNode} [props.children] - acciones extra a la
 *   izquierda del botón "Necesito ayuda" (ej: "Editar", "Entregar").
 */
const EnvioHeader = ({ accion, descripcion, children }) => (
  <Flex align="flex-end" gap="xs">
    <Box>
      <Breadcrumbs separatorMargin="sm" separator={<Title order={3}>/</Title>}>
        <Link href="/" asChild>
          <Title
            order={2}
            style={{ cursor: "pointer" }}
            c="var(--mantine-color-colorPalette-light-color)"
          >
            Envíos
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
      <Button variant="subtle" component="a" href={AYUDA_URL} target="_blank">
        Necesito ayuda
      </Button>
    </Group>
  </Flex>
);

export default EnvioHeader;
