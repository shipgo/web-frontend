import {
  ActionIcon,
  Menu,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { IconCheck, IconDeviceDesktop, IconMoonStars, IconSun } from '@tabler/icons-react';

const OPCIONES = [
  { value: 'auto', label: 'Automático', Icon: IconDeviceDesktop },
  { value: 'light', label: 'Claro', Icon: IconSun },
  { value: 'dark', label: 'Oscuro', Icon: IconMoonStars },
];

/**
 * Selector de tema de color (Automático / Claro / Oscuro) para las cabeceras de
 * las pantallas públicas y del portal del cliente, que no tienen el menú del
 * usuario de gestión. "Automático" sigue la preferencia del sistema; la
 * elección se guarda (la persiste el `MantineProvider` de la app) y vale para
 * toda la web, también al iniciar sesión.
 *
 * @param {Object} props
 * @param {number} [props.size=44] Tamaño del botón (44 px = objetivo táctil).
 */
const ThemeMenu = ({ size = 44 }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const efectivo = useComputedColorScheme('light');
  const IconActual = efectivo === 'dark' ? IconMoonStars : IconSun;

  return (
    <Menu position="bottom-end" width={180} shadow="md">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size={size}
          aria-label="Cambiar tema de color"
          data-testid="theme-menu"
        >
          <IconActual size={20} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Tema de color</Menu.Label>
        {OPCIONES.map(({ value, label, Icon }) => (
          <Menu.Item
            key={value}
            leftSection={<Icon size={16} />}
            rightSection={colorScheme === value ? <IconCheck size={14} /> : null}
            aria-current={colorScheme === value ? 'true' : undefined}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default ThemeMenu;
