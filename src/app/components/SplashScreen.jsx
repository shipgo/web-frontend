import { Box, Image } from '@mantine/core';

/**
 * Pantalla de carga de la app: verde de marca con el camión y el wordmark en
 * blanco, igual que el splash de app-mobile y que el `#splash` de `index.html`
 * (que se pinta antes que React). Se usa mientras se resuelve la sesión, así
 * entre el splash nativo de la web instalada y la primera pantalla nunca hay
 * un fondo blanco.
 */
const SplashScreen = () => (
  <Box
    role="status"
    aria-label="Cargando ShipGO!"
    data-testid="splash-screen"
    pos="fixed"
    inset={0}
    bg="#006b5a"
    style={{ zIndex: 9999, display: 'grid', placeItems: 'center' }}
  >
    <Image src="/splash.svg" alt="" w="min(220px, 56vw)" h="auto" />
  </Box>
);

export default SplashScreen;
