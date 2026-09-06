import { useEffect } from "react";
import { Card, Flex, Pagination, Text } from "@mantine/core";
import { useSet } from "@mantine/hooks";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";
import SelectionBanner from "@components/SelectionBanner";

import { useCsvExport } from "@hooks/useCsvExport";

import ListaVehiculosHeader from "./components/ListaVehiculosHeader";
import ListaVehiculosFiltros from "./components/ListaVehiculosFiltros";
import ListaVehiculosTabla from "./components/ListaVehiculosTabla";

import { useGetVehiculos } from "./hooks/useGetVehiculos";
import { VEHICULOS_CSV_COLUMNS } from "./listaVehiculos.csv";

const PAGE_LIMIT = 10;

const ListaVehiculos = () => {
  const {
    data,
    isError,
    isLoading,
    refetchVehiculos,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetVehiculos(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: VEHICULOS_CSV_COLUMNS,
    entidad: "vehiculos",
    entidadLabel: "vehículos",
  });

  const selectedIds = useSet();

  useEffect(() => {
    selectedIds.clear();
  }, [data.results]);

  const onToggle = (id) => (selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id));
  const onToggleAll = () => {
    if (data.results?.every((i) => selectedIds.has(i.id))) {
      data.results.forEach((i) => selectedIds.delete(i.id));
    } else {
      data.results?.forEach((i) => selectedIds.add(i.id));
    }
  };

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <ListaVehiculosHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaVehiculosFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="vehículo seleccionado"
        plural="vehículos seleccionados"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: "Cargando vehículos..." }}
          onError={{
            show: isError,
            onClick: refetchVehiculos,
            description: "Ocurrió un error al cargar los vehículos",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin vehículos que mostrar",
            description: "Parece que no hay vehículos registrados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: "Sin resultados",
            description: "No se encontraron vehículos con los filtros aplicados",
          }}
        >
          <ListaVehiculosTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetchVehiculos}
          />
        </ScreenContainer>
      </Card>

      <Flex align="center">
        <Pagination
          value={page}
          onChange={setPage}
          total={Math.ceil(data.total / PAGE_LIMIT) || 1}
          disabled={!showPagination}
        />
        <Text c="dimmed" ml="auto">
          {data.total > 0
            ? `Mostrando ${(page - 1) * PAGE_LIMIT + 1} - ${Math.min(page * PAGE_LIMIT, data.total)} de ${data.total} resultados`
            : "0 resultados"}
        </Text>
      </Flex>
    </PageContainer>
  );
};

export default ListaVehiculos;
