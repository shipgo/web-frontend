import { Link } from 'wouter';
import {
  Box,
  Button,
  Card,
  Container,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

import { LANDING_ACCESSES } from '../constants/content';

/**
 * Los 4 accesos diferenciados de la landing (criterio de aceptación de
 * `SHG-FE-044`): login interno, login del customer (ruta propia), registro de
 * customer y tracking guest. Cada uno es una `Card` con su propio CTA — nunca
 * el mismo link para operador y customer.
 */
const AccessesSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }}>
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Elegí cómo entrar</Title>
          <Text c="dimmed">Cuatro caminos distintos, según quién seas.</Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {LANDING_ACCESSES.map((access) => (
            <Card key={access.id} withBorder padding="lg" h="100%">
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
                <Button component={Link} href={access.href} variant="light" fullWidth>
                  {access.ctaLabel}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  </Box>
);

export default AccessesSection;
