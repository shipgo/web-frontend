import { Button, Menu } from "@mantine/core";
import { modals } from "@mantine/modals";

import { IconChevronDown } from "@tabler/icons-react";
import SeleccionSucursalModal from "./SeleccionSucursalModal";

import { ACTIONS } from "../constants";

const EnviosAcciones = ({ selectedPackages, onSelectedAction }) => {
  const selectedPackagesAmount = selectedPackages.size;

  if (selectedPackagesAmount === 0) {
    return null;
  }

  const openSeleccionSucursalModal = () =>
    modals.open({
      modalId: "seleccion-sucursal",
      title: "Transferir paquetes",
      children: (
        <SeleccionSucursalModal
          selectedPackagesAmount={selectedPackagesAmount}
          onSelectedSucursal={(sucursal) =>
            onSelectedAction({
              sucursal,
              action: ACTIONS.TRANSFERENCIA_SUCURSAL,
            })
          }
        />
      ),
    });

  const onEntregaLocalAction = () =>
    onSelectedAction({ action: ACTIONS.ENTREGA_LOCAL });

  return (
    <Menu>
      <Menu.Target>
        {/* `c="var(--shg-button-text-primary)"`: ver ese token en
            `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto del
            color primario en `variant="light"` no llega a 4.5:1 en dark
            mode (axe-core `color-contrast`, SHG-FE-070). */}
        <Button
          radius="0"
          variant="light"
          rightSection={<IconChevronDown size={16} />}
          c="var(--shg-button-text-primary)"
        >
          Marcar envíos para...
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item onClick={onEntregaLocalAction}>
          Entrega a destino final
        </Menu.Item>
        <Menu.Item onClick={openSeleccionSucursalModal}>
          Transferencia a sucursal
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default EnviosAcciones;
