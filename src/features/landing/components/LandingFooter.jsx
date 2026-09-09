import { Anchor, Box, Container, Divider, Group, Stack, Text } from '@mantine/core';

import { LANDING_FOOTER } from '../constants/content';

/**
 * Footer de la landing: contacto + legales. Draft con placeholders (owner,
 * 2026-09-08) — los links legales no navegan a nada todavía porque esas
 * páginas no existen (TODO owner), así que se listan como texto y no como
 * `Anchor` para no dejar links rotos.
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

          <Text size="xs" c="gray.5">
            © {year} {LANDING_FOOTER.copyrightHolder}. Todos los derechos reservados.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingFooter;
