import {
  ActionIcon,
  Box,
  Card,
  Group,
  NumberFormatter,
  Stack,
  Table,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconPackage, IconTrash } from "@tabler/icons-react";

import ScreenContainer from "@components/ScreenContainer";

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";
import { CATEGORIAS, TAMANOS } from "../constants/mocks";
import AgregarPaqueteModal from "./AgregarPaqueteModal";

const getTamanoLabel = (value) =>
  TAMANOS.find((t) => t.value === value)?.label ?? value;

const getCategoriaLabel = (value) =>
  CATEGORIAS.find((c) => c.value === value)?.label ?? value;

const SeccionCarga = () => {
  const form = useEnvioFormContext();
  const paquetes = form.values.paquetes;

  const handleAddPaquete = (nuevoPaquete) => {
    form.insertListItem("paquetes", nuevoPaquete);
  };

  const handleRemovePaquete = (index) => {
    form.removeListItem("paquetes", index);
  };

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Group gap="0.75rem">
            <ThemeIcon size="xl" variant="light">
              <IconPackage />
            </ThemeIcon>
            <Box>
              <Title order={4}>Paquetes del envío</Title>
              <Title c="dimmed" order={6} fw="normal">
                Agregá los paquetes o bultos que forman parte de este envío
              </Title>
            </Box>
          </Group>
          <AgregarPaqueteModal onAdd={handleAddPaquete} />
        </Group>

        <ScreenContainer
          onEmptyData={{
            show: paquetes.length === 0,
            title: "Sin paquetes cargados",
            description:
              'Usá el botón "Añadir paquete" para agregar paquetes al envío',
          }}
        >
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Tamaño</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th>Peso</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th>Dimensiones</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paquetes.map((paquete, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td>{getTamanoLabel(paquete.tamano)}</Table.Td>
                  <Table.Td>{getCategoriaLabel(paquete.categoria)}</Table.Td>
                  <Table.Td>
                    <NumberFormatter value={paquete.peso} suffix=" kg" />
                  </Table.Td>
                  <Table.Td>{paquete.descripcion || "-"}</Table.Td>
                  <Table.Td>
                    {paquete.tamano === "personalizado"
                      ? `${paquete.largo} × ${paquete.ancho} × ${paquete.alto} cm`
                      : "-"}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      size="lg"
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemovePaquete(index)}
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScreenContainer>
      </Stack>
    </Card>
  );
};

export default SeccionCarga;
