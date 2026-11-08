import { Accordion, Box, Card, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";

import { useIsMobile } from "@hooks/useIsMobile";

/**
 * Sección de los formularios de viaje (Crear/Editar): encabezado con ícono,
 * título y bajada + contenido.
 *
 * - Escritorio: la `Card` de siempre (`cardProps` pasa `h`, `padding`, etc.).
 * - Mobile (< sm): ítem de `Accordion` plegable. Los paneles quedan montados
 *   (el estado de los listados y del form se conserva al plegar).
 *
 * Tiene que usarse dentro de `SeccionesAcordeon` para que en mobile compartan
 * el mismo `Accordion`.
 */
const SeccionPlegable = ({ value, icon, title, description, cardProps, children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Accordion.Item value={value}>
        <Accordion.Control icon={<ThemeIcon size="lg" variant="light">{icon}</ThemeIcon>}>
          <Title order={5}>{title}</Title>
          {description && (
            <Text c="dimmed" size="xs" lh={1.3}>
              {description}
            </Text>
          )}
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>{children}</Stack>
        </Accordion.Panel>
      </Accordion.Item>
    );
  }

  return (
    <Card component={Stack} {...cardProps}>
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          {icon}
        </ThemeIcon>

        <Box>
          <Title order={4}>{title}</Title>
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        </Box>
      </Group>
      {children}
    </Card>
  );
};

/**
 * Agrupa varias `SeccionPlegable`. En escritorio es un fragmento (las cards
 * quedan como hijos directos del contenedor, igual que antes); en mobile un
 * `Accordion` múltiple con todas las secciones abiertas por defecto.
 */
export const SeccionesAcordeon = ({ children, valoresAbiertos }) => {
  const isMobile = useIsMobile();
  if (!isMobile) return <>{children}</>;
  return (
    <Accordion multiple variant="separated" defaultValue={valoresAbiertos}>
      {children}
    </Accordion>
  );
};

export default SeccionPlegable;
