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
        <Button
          radius="0"
          variant="light"
          rightSection={<IconChevronDown size={16} />}
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
