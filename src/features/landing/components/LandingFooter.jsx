import { Anchor, Box, Container, Divider, Group, Stack, Text } from '@mantine/core';

import { LANDING_FOOTER, LANDING_PHOTO_CREDITS } from '../constants/content';

/**
 * Footer de la landing: contacto + legales + crédito discreto de las fotos de
 * Unsplash usadas en la página (la licencia no lo exige, pero es una buena
 * práctica hacia los fotógrafos y deja claro que son interinas).
 *
 * Draft con datos de contacto de staging (owner, 2026-09-08/10) — el owner
 * los reemplaza después. Los links legales no navegan a nada todavía porque
 * esas páginas no existen (TODO owner), así que se listan como texto y no
 * como `Anchor` para no dejar links rotos.
 */
const LandingFooter = () => {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" py="xl" px={{ base: 'md', sm: 'xl' }} bg="dark.8" c="gray.2">
      <Container size="lg">
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap" gap="xl">
            <Stack gap={4}>
              <Text fw={600} c="white">
                ShipGo
              </Text>
              <Anchor href={`mailto:${LANDING_FOOTER.contactEmail}`} c="gray.3" size="sm">
                {LANDING_FOOTER.contactEmail}
              </Anchor>
              <Text size="sm" c="gray.4">
                {LANDING_FOOTER.contactPhone}
              </Text>
            </Stack>

            <Stack gap={4}>
              <Text fw={600} size="sm" c="white">
                Legal
              </Text>
              {LANDING_FOOTER.legalLinks.map((link) => (
                <Text key={link.label} size="sm" c="gray.4">
                  {link.label}
                </Text>
              ))}
            </Stack>
          </Group>

          <Divider color="dark.5" />

          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="xs" c="gray.5">
              © {year} {LANDING_FOOTER.copyrightHolder}. Todos los derechos reservados.
            </Text>
            <Text size="xs" c="gray.5">
              Fotos:{' '}
              {LANDING_PHOTO_CREDITS.map((credit, index) => (
                <span key={credit.url}>
                  <Anchor href={credit.url} target="_blank" rel="noopener noreferrer" c="gray.4" size="xs">
                    {credit.name}
                  </Anchor>
                  {index < LANDING_PHOTO_CREDITS.length - 1 ? ', ' : ''}
                </span>
              ))}
              {' '}en Unsplash.
            </Text>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingFooter;
