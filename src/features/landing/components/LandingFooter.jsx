import { Anchor, Box, Collapse, Container, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { useIsMobile } from '@hooks/useIsMobile';

import { LANDING_FOOTER, LANDING_PHOTO_CREDITS } from '../constants/content';

/** Lista de enlaces a los fotógrafos de Unsplash, separada por comas. */
const PhotoCreditLinks = () => (
  <>
    {LANDING_PHOTO_CREDITS.map((credit, index) => (
      <span key={credit.url}>
        <Anchor href={credit.url} target="_blank" rel="noopener noreferrer" c="gray.4" size="xs">
          {credit.name}
        </Anchor>
        {index < LANDING_PHOTO_CREDITS.length - 1 ? ', ' : ''}
      </span>
    ))}
  </>
);

/** Mobile: los créditos quedan plegados detrás de un enlace. */
const CollapsedPhotoCredits = () => {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Stack gap={4}>
      <UnstyledButton
        onClick={toggle}
        aria-expanded={opened}
        aria-controls="landing-photo-credits"
        mih={44}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Text size="xs" c="gray.4" td="underline">
          Créditos de las fotos
        </Text>
      </UnstyledButton>
      <Collapse expanded={opened} id="landing-photo-credits">
        <Text size="xs" c="gray.5">
          Fotos: <PhotoCreditLinks /> en Unsplash.
        </Text>
      </Collapse>
    </Stack>
  );
};

/**
 * Footer de la landing: contacto + legales + crédito discreto de las fotos de
 * Unsplash usadas en la página (la licencia no lo exige, pero es una buena
 * práctica hacia los fotógrafos y deja claro que son interinas). En mobile el
 * contacto y lo legal ocupan pocas líneas y los créditos se pliegan.
 *
 * Draft con datos de contacto de staging (owner, 2026-09-08/10) — el owner los
 * reemplaza después. Los links legales no navegan a nada todavía porque esas
 * páginas no existen (TODO owner), así que se listan como texto y no como
 * `Anchor` para no dejar links rotos.
 */
const LandingFooter = () => {
  const year = new Date().getFullYear();
  const isMobile = useIsMobile();
  const legal = LANDING_FOOTER.legalLinks.map((link) => link.label);

  return (
    <Box component="footer" py={{ base: 'lg', sm: 'xl' }} px={{ base: 'md', sm: 'xl' }} bg="dark.8" c="gray.2">
      <Container size="lg">
        <Stack gap="md">
          {isMobile ? (
            <Stack gap={4}>
              <Text fw={600} c="white">
                ShipGo
              </Text>
              <Text size="sm" c="gray.4">
                <Anchor href={`mailto:${LANDING_FOOTER.contactEmail}`} c="gray.3" size="sm">
                  {LANDING_FOOTER.contactEmail}
                </Anchor>
                {' · '}
                {LANDING_FOOTER.contactPhone}
              </Text>
              <Text size="sm" c="gray.4">
                {legal.join(' · ')}
              </Text>
            </Stack>
          ) : (
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
                {legal.map((label) => (
                  <Text key={label} size="sm" c="gray.4">
                    {label}
                  </Text>
                ))}
              </Stack>
            </Group>
          )}

          <Divider color="dark.5" />

          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="xs" c="gray.5">
              © {year} {LANDING_FOOTER.copyrightHolder}. Todos los derechos reservados.
            </Text>
            {isMobile ? (
              <CollapsedPhotoCredits />
            ) : (
              <Text size="xs" c="gray.5">
                Fotos: <PhotoCreditLinks /> en Unsplash.
              </Text>
            )}
          </Group>
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingFooter;
