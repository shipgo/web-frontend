import { useEffect } from "react";
import { Card, Flex, Pagination, Text } from "@mantine/core";
import { useSet } from "@mantine/hooks";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";
import SelectionBanner from "@components/SelectionBanner";

import { useCsvExport } from "@hooks/useCsvExport";

import ListaMantenimientosHeader from "./components/ListaMantenimientosHeader";
import ListaMantenimientosFiltros from "./components/ListaMantenimientosFiltros";
import ListaMantenimientosTabla from "./components/ListaMantenimientosTabla";

import { useGetMantenimientos } from "./hooks/useGetMantenimientos";
import { MANTENIMIENTOS_CSV_COLUMNS } from "./listaMantenimientos.csv";

const PAGE_LIMIT = 10;

const ListaMantenimientos = () => {
  const {
    data,
    isError,
    isLoading,
    refetchMantenimientos,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetMantenimientos(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: MANTENIMIENTOS_CSV_COLUMNS,
    entidad: "mantenimientos",
    entidadLabel: "mantenimientos",
  });

  const selectedIds = useSet();

  useEffect(() => {
    selectedIds.clear();
  }, [data.results]);

  const onToggle = (id) =>
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);

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
      <ListaMantenimientosHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaMantenimientosFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="mantenimiento seleccionado"
        plural="mantenimientos seleccionados"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: "Cargando mantenimientos..." }}
          onError={{
            show: isError,
            onClick: refetchMantenimientos,
            description: "Ocurrió un error al cargar los mantenimientos",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin mantenimientos que mostrar",
            description: "Parece que no hay mantenimientos registrados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: "Sin resultados",
            description: "No se encontraron mantenimientos con los filtros aplicados",
          }}
        >
          <ListaMantenimientosTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetchMantenimientos}
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

export default ListaMantenimientos;
