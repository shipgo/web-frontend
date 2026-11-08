import { Link } from 'wouter';
import { Anchor, Box, Button, Group, Image, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

import logo from '/src/assets/logoipsum-custom-logo.svg';

import { LANDING_LOGIN_OPTIONS } from '../constants/content';

/**
 * Header de la landing pública: logo a la izquierda y menú "Ingresar" a la
 * derecha (cliente → portal, equipo → login interno).
 */
const LandingHeader = () => (
  <Box component="header" py="md" px={{ base: 'md', sm: 'xl' }}>
    <Group justify="space-between" wrap="nowrap">
      <Anchor component={Link} href="/" aria-label="ShipGo — inicio" display="inline-block">
        <Image src={logo} h={32} w="auto" fit="contain" alt="ShipGo" />
      </Anchor>

      <Menu position="bottom-end" width={200} shadow="md">
        <Menu.Target>
          <Button
            variant="light"
            size="sm"
            h={{ base: 44, sm: 36 }}
            c="var(--shg-button-text-primary)"
            rightSection={<IconChevronDown size={16} />}
          >
            Ingresar
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {LANDING_LOGIN_OPTIONS.map((option) => (
            <Menu.Item key={option.id} component={Link} href={option.href} py="sm">
              {option.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  </Box>
);

export default LandingHeader;
