import { Link } from 'wouter';
import { Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconMapPin, IconUserPlus } from '@tabler/icons-react';

import { LANDING_HERO } from '../constants/content';

/**
 * Hero de la landing: propuesta de valor + 2 CTA principales. El resto de los
 * accesos (login interno, login customer, tracking directo) viven en
 * `AccessesSection`, diferenciados y con igual jerarquía visual.
 */
const HeroSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }} bg="colorPalette.0">
    <Container size="md">
      <Stack gap="md" maw={640}>
        <Text
          size="sm"
          fw={600}
          c="colorPalette.8"
          tt="uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {LANDING_HERO.eyebrow}
        </Text>
        <Title order={1}>{LANDING_HERO.title}</Title>
        <Text size="lg" c="dimmed">
          {LANDING_HERO.subtitle}
        </Text>
        <Group gap="sm" mt="sm">
          <Button
            component="a"
            href={LANDING_HERO.primaryCta.href}
            size="md"
            leftSection={<IconMapPin size={18} />}
          >
            {LANDING_HERO.primaryCta.label}
          </Button>
          <Button
            component={Link}
            href={LANDING_HERO.secondaryCta.href}
            variant="light"
            size="md"
            leftSection={<IconUserPlus size={18} />}
          >
            {LANDING_HERO.secondaryCta.label}
          </Button>
        </Group>
      </Stack>
    </Container>
  </Box>
);

export default HeroSection;
