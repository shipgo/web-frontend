import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { Button, Group, Select, Stack } from "@mantine/core";

import { useQuery } from "@tanstack/react-query";

import ScreenContainer from "@components/ScreenContainer";
import { sucursalApi } from "@api";
import { REINTENTAR_MAS_TARDE } from "@copy/common";

/**
 * `GET /api/sucursal/sucursalesRestantes` (SU/AD) — sucursales a las que se
 * puede transferir un envío (no requiere `GET /api/sucursal/all`, que es
 * SU-only).
 */
const SeleccionSucursalModal = ({
  selectedPackagesAmount,
  onSelectedSucursal,
}) => {
  const {
    isError,
    isFetching,
    refetch,
    data: sucursales = [],
  } = useQuery({
    queryKey: ["sucursales-restantes"],
    queryFn: () => sucursalApi.getSucursalesRestantes(),
  });

  const options = sucursales.map((sucursal) => ({
    value: String(sucursal.id),
    label: sucursal.nombre,
  }));

  const { getInputProps, onSubmit } = useForm({
    initialValues: {
      sucursal: null,
    },
  });

  const handleClose = () => modals.close("seleccion-sucursal");
  const handleSubmit = ({ sucursal }) => {
    const selectedSucursal = sucursales.find(
      (s) => String(s.id) === sucursal,
    );
    if (!selectedSucursal) return;
    onSelectedSucursal(selectedSucursal);
    handleClose();
  };

  return (
    <ScreenContainer
      styleProps={{
        h: "140",
      }}
      onLoading={{
        show: isFetching,
        description: "Cargando sucursales...",
      }}
      onError={{
        show: isError,
        onClick: refetch,
        title: "No pudimos cargar las sucursales",
        description: REINTENTAR_MAS_TARDE,
      }}
    >
      <Stack component="form" onSubmit={onSubmit(handleSubmit)}>
        <Select
          {...getInputProps("sucursal")}
          searchable
          data={options}
          label="Sucursal de entrega"
          placeholder="Seleccioná una sucursal"
          description={`Vas a dejar ${selectedPackagesAmount} ${selectedPackagesAmount > 1 ? "envíos" : "envío"} en esta sucursal.`}
        />

        <Group gap="xs">
          <Button type="submit">Confirmar</Button>
          <Button variant="subtle" onClick={handleClose}>
            Cancelar
          </Button>
        </Group>
      </Stack>
    </ScreenContainer>
  );
};

export default SeleccionSucursalModal;
