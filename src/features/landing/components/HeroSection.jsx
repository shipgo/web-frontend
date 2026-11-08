import { Link, useLocation } from 'wouter';
import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconMapPin, IconUserPlus } from '@tabler/icons-react';

import { TrackingSearchForm } from '@features/tracking';
import { useIsMobile } from '@hooks/useIsMobile';

import { LANDING_HERO } from '../constants/content';

/**
 * Hero de la landing. Escritorio: propuesta de valor + 2 CTA + foto (Unsplash,
 * interina — ver crédito en `LANDING_HERO.image.credit`). Mobile (< sm): copy
 * corto y el campo de código de seguimiento directo en el primer pliegue
 * (mismo `TrackingSearchForm` y destino `/tracking/:codigo` que
 * `QuickTrackingSection`, que en mobile no se renderiza); la foto se oculta.
 */
const HeroSection = () => {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const copy = LANDING_HERO.mobile;

  return (
    <Box component="section" py={{ base: 'lg', sm: 64 }} bg="var(--mantine-color-colorPalette-light)">
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 48 }} verticalSpacing="xl">
          <Stack gap="md" justify="center">
            <Text
              size="sm"
              fw={600}
              c="colorPalette.8"
              tt="uppercase"
              style={{ letterSpacing: '0.08em' }}
            >
              {LANDING_HERO.eyebrow}
            </Text>
            <Title order={1}>{isMobile ? copy.title : LANDING_HERO.title}</Title>
            <Text size="lg" c="dimmed">
              {isMobile ? copy.subtitle : LANDING_HERO.subtitle}
            </Text>

            {isMobile ? (
              <>
                <Card withBorder padding="md">
                  <TrackingSearchForm
                    autoFocus={false}
                    onSubmit={(codigo) => setLocation(`/tracking/${codigo}`)}
                  />
                </Card>
                <Text size="sm">
                  {copy.accountPrompt}{' '}
                  <Anchor component={Link} href={copy.accountHref} fw={600}>
                    {copy.accountLinkLabel}
                  </Anchor>
                </Text>
              </>
            ) : (
              <Group gap="sm" mt="sm">
                <Button
                  component="a"
                  href={LANDING_HERO.primaryCta.href}
                  size="md"
                  leftSection={<IconMapPin size={18} />}
                >
                  {LANDING_HERO.primaryCta.label}
                </Button>
                {/* `c="var(--shg-button-text-primary)"`: ver ese token en
                    `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto
                    del color primario en `variant="light"` no llega a 4.5:1 en
                    dark mode (axe-core `color-contrast`, SHG-FE-070). */}
                <Button
                  component={Link}
                  href={LANDING_HERO.secondaryCta.href}
                  variant="light"
                  size="md"
                  leftSection={<IconUserPlus size={18} />}
                  c="var(--shg-button-text-primary)"
                >
                  {LANDING_HERO.secondaryCta.label}
                </Button>
              </Group>
            )}
          </Stack>

          <Image
            src={LANDING_HERO.image.src}
            alt={LANDING_HERO.image.alt}
            radius="lg"
            h={{ base: 260, sm: 340, md: 400 }}
            fit="cover"
            fetchPriority="high"
            visibleFrom="sm"
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default HeroSection;
