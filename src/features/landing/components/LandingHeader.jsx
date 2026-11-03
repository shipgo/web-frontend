import { Link } from 'wouter';
import { Anchor, Box, Image } from '@mantine/core';

import logo from '/src/assets/logoipsum-custom-logo.svg';

/**
 * Header de la landing pública: sólo branding (a diferencia del `PublicLayout`
 * usado por tracking/portal, acá no hace falta un slot a la derecha porque los
 * 4 accesos ya tienen su propia sección en el cuerpo de la página).
 */
const LandingHeader = () => (
  <Box component="header" py="md" px={{ base: 'md', sm: 'xl' }}>
    <Anchor component={Link} href="/" aria-label="ShipGo — inicio" display="inline-block">
      <Image src={logo} h={32} w="auto" fit="contain" alt="ShipGo" />
    </Anchor>
  </Box>
);

export default LandingHeader;
