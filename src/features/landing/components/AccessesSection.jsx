import { Link } from 'wouter';
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';

import { useIsMobile } from '@hooks/useIsMobile';

import { LANDING_ACCESSES, LANDING_ACCESSES_COMPACT } from '../constants/content';

/**
 * Una tarjeta de `AccessesSection`, con el mismo criterio de hover
 * (`shadow` dinámico vía `useHover`) que `HomeItem` en el resto de la app.
 */
const AccessCard = ({ access }) => {
  const { hovered, ref } = useHover();

  return (
    <Card
      ref={ref}
      withBorder
      padding="lg"
      h="100%"
      shadow={hovered ? 'md' : 'xs'}
      style={{ transition: 'box-shadow 150ms ease' }}
    >
      <Stack gap="sm" h="100%" justify="space-between">
        <Stack gap="xs">
          <ThemeIcon size={40} radius="md" variant="light" aria-hidden="true">
            {access.icon}
          </ThemeIcon>
          <Title order={3} fz="md">
            {access.title}
          </Title>
          <Text size="sm" c="dimmed">
            {access.description}
          </Text>
        </Stack>
        {/* `c="var(--shg-button-text-primary)"`: ver ese token en
            `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto del
            color primario en `variant="light"` no llega a 4.5:1 en dark
            mode (axe-core `color-contrast`, SHG-FE-070). La landing usa el
            mismo `MantineProvider`/`defaultColorScheme="auto"` que el resto
            de la app (`App.jsx`). */}
        <Button
          component={Link}
          href={access.href}
          variant="light"
          fullWidth
          c="var(--shg-button-text-primary)"
        >
          {access.ctaLabel}
        </Button>
      </Stack>
    </Card>
  );
};

/** Fila compacta (mobile): ícono, título, descripción corta y chevron; ≥ 44 px. */
const AccessRow = ({ access }) => (
  <Paper
    withBorder
    component={Link}
    href={access.href}
    p="sm"
    mih={64}
    style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
  >
    <Group wrap="nowrap" gap="sm">
      <ThemeIcon size={40} radius="md" variant="light" aria-hidden="true">
        {access.icon}
      </ThemeIcon>
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600}>{access.title}</Text>
        <Text size="sm" c="dimmed">
          {access.description}
        </Text>
      </Stack>
      <IconChevronRight size={20} aria-hidden="true" />
    </Group>
  </Paper>
);

/**
 * Los 4 accesos diferenciados de la landing (criterio de aceptación de
 * `SHG-FE-044`): login interno, login del customer (ruta propia), registro de
 * customer y tracking guest. Cada uno es una `Card` con su propio CTA — nunca
 * el mismo link para operador y customer.
 */
const AccessesSection = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Box component="section" py="xl">
        <Container size="lg">
          <Stack gap="md">
            <Title order={2}>Ingresá a tu cuenta</Title>
            <Stack gap="xs">
              {LANDING_ACCESSES_COMPACT.map((access) => (
                <AccessRow key={access.id} access={access} />
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
  <Box component="section" py={{ base: 'xl', sm: 64 }}>
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Elegí cómo entrar</Title>
          <Text c="dimmed">Cuatro caminos distintos, según quién seas.</Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {LANDING_ACCESSES.map((access) => (
            <AccessCard key={access.id} access={access} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  </Box>
  );
};

export default AccessesSection;
