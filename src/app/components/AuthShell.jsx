import { Link } from 'wouter';
import { Anchor, Box, Flex, Group, Image, Stack, Text, Title } from '@mantine/core';

import BrandLogo from '@components/BrandLogo';
import ThemeMenu from '@components/ThemeMenu';

import background from '/src/assets/background.jpg';

import classes from './AuthShell.module.css';

const DEFAULT_WIDTH = 400;
// Relleno horizontal de la tarjeta centrada en escritorio (`p={40}`) por lado.
const CARD_PADDING = 40;

/** Logo de ShipGo que lleva a la landing (o al home por rol si ya hay sesión). */
const AuthLogo = () => (
  <Anchor
    component={Link}
    href="/"
    aria-label="ShipGo — inicio"
    w="fit-content"
    display="inline-block"
  >
    <BrandLogo h={{ base: 28, sm: 50 }} alt="Logo de ShipGo" />
  </Anchor>
);

const AuthTitle = ({ title, subtitle }) => (
  <Stack gap={4}>
    <Title order={1} fz={{ base: 26, sm: 32 }}>
      {title}
    </Title>
    {subtitle ? <Text c="dimmed">{subtitle}</Text> : null}
  </Stack>
);

/**
 * Molde compartido de las pantallas públicas de acceso: login, recuperar
 * cuenta, reset/activación por token y registro. Respeta el tema elegido
 * (Automático / Claro / Oscuro): el selector `ThemeMenu` queda arriba a la
 * derecha. Antes forzaba `light` por la foto y el logo de marca; ahora el logo es
 * el que se adapta al tema (`BrandLogo`) y la foto es decorativa.
 *
 * - `variant="centered"` (default): una columna de `width` px. En mobile no hay
 *   tarjeta (fondo del tema, relleno de 16 px, formulario arriba para que el
 *   teclado no tape el botón); desde `sm`, tarjeta con borde y sombra suave.
 * - `variant="split"` (login): el formulario a la izquierda, sin tarjeta ni
 *   borde, y la foto de marca a la derecha (sólo desde `sm`; no se descarga en
 *   mobile). `footer` va al pie de la columna del formulario.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} [props.subtitle]
 * @param {import('react').ReactNode} props.children
 * @param {'centered'|'split'} [props.variant='centered']
 * @param {number} [props.width=400] Ancho máximo del contenido en px.
 * @param {import('react').ReactNode} [props.footer] Sólo `split`.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  variant = 'centered',
  width = DEFAULT_WIDTH,
  footer = null,
}) => {
  if (variant === 'split') {
    return (
      <Flex mih="100dvh" wrap="nowrap" bg="var(--mantine-color-body)">
        <Flex
          direction="column"
          miw={0}
          px={{ base: 'md', sm: 56 }}
          pt={{ base: 'md', sm: 36 }}
          pb="md"
          style={{ flex: '1 1 0' }}
        >
          <Group justify="space-between" wrap="nowrap">
            <AuthLogo />
            <ThemeMenu />
          </Group>
          {/* Mobile: arriba (no centrado) para que con el teclado abierto se vean contraseña y botón. */}
          <Stack
            gap="lg"
            w="100%"
            maw={width}
            mx={{ base: 0, sm: 'auto' }}
            my={{ base: 'lg', sm: 'auto' }}
          >
            <AuthTitle title={title} subtitle={subtitle} />
            {children}
          </Stack>
          {footer ? (
            <Flex gap="lg" mt="auto" justify={{ base: 'center', sm: 'flex-start' }}>
              {footer}
            </Flex>
          ) : null}
        </Flex>
        <Box visibleFrom="sm" pos="relative" miw={0} style={{ flex: '1.08 1 0' }}>
          <Image
            src={background}
            alt=""
            loading="lazy"
            fit="cover"
            pos="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
          />
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      mih="100dvh"
      justify="center"
      // Mobile: arriba (no centrada) para que con el teclado se vea el campo y el botón.
      align={{ base: 'flex-start', sm: 'center' }}
      p={{ base: 'md', sm: 'xl' }}
      pos="relative"
      className={classes.page}
    >
      <Box pos="absolute" top={{ base: 8, sm: 16 }} right={{ base: 8, sm: 16 }}>
        <ThemeMenu />
      </Box>
      <Box className={classes.card} maw={width + CARD_PADDING * 2} p={{ base: 0, sm: CARD_PADDING }}>
        <Stack gap="lg">
          <Stack gap="md">
            <AuthLogo />
            <AuthTitle title={title} subtitle={subtitle} />
          </Stack>
          {children}
        </Stack>
      </Box>
    </Flex>
  );
};

export default AuthShell;
