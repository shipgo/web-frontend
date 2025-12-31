import { useState } from "react";

import { Box, Button, Checkbox, Group, Table, Text } from "@mantine/core"

import ScreenContainer from "@components/ScreenContainer"

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

import PaquetesForm from "./PaquetesForm";

const ListadoPaquetes = () => {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const { values: { paquetes }, setFieldValue } = useEnvioFormContext();

  const handleRowSelect = (rowId) => {
    const newSelectedRows = new Set(selectedRows);
    newSelectedRows.has(rowId) ? newSelectedRows.delete(rowId) : newSelectedRows.add(rowId);
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paquetes.length) {
      setSelectedRows(new Set());
      return;
    }

    setSelectedRows(new Set(paquetes.map(item => item.id)));
  };

  const handleDeleteSelectedRows = () => {
    if (selectedRows.size === paquetes.length) {
      setFieldValue('paquetes', []);
    } else {
      setFieldValue('paquetes', prev => prev.filter(({ id }) => !selectedRows.has(id)));
    }

    setSelectedRows(new Set());
  };

  const renderAmount = () => {
    if (paquetes.length === 0) return "Sin paquetes cargados";
    if (paquetes.length === 1) return "1 paquete cargado";
    return `${paquetes.length} paquetes cargados`;
  }

  console.log(paquetes);

  return (
    <Box>
      <Group mb="sm" align="center">
        <Text c="gray" mr="auto">{renderAmount()}</Text>

        {selectedRows.size > 0 && (
          <Button variant="subtle" onClick={handleDeleteSelectedRows}>
            Eliminar paquetes seleccionados
          </Button>
        )}

        <PaquetesForm />
      </Group>

      <ScreenContainer
        onEmptyData={{
          show: paquetes.length === 0,
          title: 'Sin paquetes agregados',
          description: "Agregá un paquete para verlo en la lista",
        }}
      >
        <Table
          stickyHeader
          highlightOnHover
          verticalSpacing='md'
          horizontalSpacing="md"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  variant="outline"
                  onChange={handleSelectAll}
                  checked={selectedRows.size === paquetes.length}
                  indeterminate={selectedRows.size > 0 && selectedRows.size < paquetes.length}
                />
              </Table.Th>
              <Table.Th>Peso (Kg)</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Comentario</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paquetes.map(({ id, categoria, comentario, peso }) => (
              <Table.Tr key={id}>
                <Table.Td>
                  <Checkbox
                    variant="outline"
                    checked={selectedRows.has(id)}
                    onChange={() => handleRowSelect(id)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text>{peso}</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{categoria}</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{comentario === '' ? '-' : comentario}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScreenContainer>
    </Box>
  )
}

export default ListadoPaquetes