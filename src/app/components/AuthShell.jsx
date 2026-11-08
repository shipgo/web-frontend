import { Link } from 'wouter';
import { Anchor, Box, Flex, Image, Stack, Text, Title } from '@mantine/core';

import ForcedLightScheme from '@components/ForcedLightScheme';

import logo from '/src/assets/logoipsum-custom-logo.svg';
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
    <Image
      src={logo}
      alt="Logo de ShipGo"
      h={{ base: 28, sm: 'auto' }}
      w={{ base: 'auto', sm: 120 }}
      fit="contain"
    />
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
 * cuenta, reset/activación por token y registro. Fuerza tema `light` (igual que
 * la landing): estas vistas tienen una foto/logo de marca fijos que no fueron
 * diseñados para dark mode.
 *
 * - `variant="centered"` (default): una columna de `width` px. En mobile no hay
 *   tarjeta (fondo blanco, relleno de 16 px, formulario arriba para que el
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
      <ForcedLightScheme>
        <Flex mih="100dvh" wrap="nowrap" bg="white">
          <Flex
            direction="column"
            miw={0}
            px={{ base: 'md', sm: 56 }}
            pt={{ base: 'md', sm: 36 }}
            pb="md"
            style={{ flex: '1 1 0' }}
          >
            <AuthLogo />
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
      </ForcedLightScheme>
    );
  }

  return (
    <ForcedLightScheme>
      <Flex
        mih="100dvh"
        justify="center"
        // Mobile: arriba (no centrada) para que con el teclado se vea el campo y el botón.
        align={{ base: 'flex-start', sm: 'center' }}
        p={{ base: 'md', sm: 'xl' }}
        className={classes.page}
      >
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
    </ForcedLightScheme>
  );
};

export default AuthShell;
