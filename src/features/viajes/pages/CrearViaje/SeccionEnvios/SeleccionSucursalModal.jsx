import React from "react";

import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { Button, Group, Select, Stack } from "@mantine/core";

import { useQuery } from "@tanstack/react-query";

import ScreenContainer from "@components/ScreenContainer";

const SUCURSALES = [
  { id: "1", nombre: "Sucursal A" },
  { id: "2", nombre: "Sucursal B" },
  { id: "3", nombre: "Sucursal C" },
];

const SeleccionSucursalModal = ({
  selectedPackagesAmount,
  onSelectedSucursal,
}) => {
  const {
    isError,
    isFetching,
    refetch,
    data: sucursales,
  } = useQuery({
    queryKey: ["sucursales"],
    initialData: [],
    queryFn: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(SUCURSALES);
        }, 1000);
      }),
    select: (data) =>
      data.map((sucursal) => ({
        value: sucursal.id,
        label: sucursal.nombre,
      })),
  });

  const { getInputProps, onSubmit } = useForm({
    initialValues: {
      sucursal: null,
    },
  });

  const handleClose = () => modals.close("seleccion-sucursal");
  const handleSubmit = ({ sucursal }) => {
    const selectedSucursal = SUCURSALES.find((s) => s.id === sucursal);
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
        title: "Error al cargar las sucursales",
        description: "Ocurrió un error al cargar las sucursales",
      }}
    >
      <Stack component="form" onSubmit={onSubmit(handleSubmit)}>
        <Select
          {...getInputProps("sucursal")}
          searchable
          data={sucursales}
          label="Sucursal a transferir"
          placeholder="Seleccioná una sucursal"
          description={`Vas a transferir ${selectedPackagesAmount} paquete${selectedPackagesAmount > 1 ? "s" : ""} a esta sucursal`}
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
