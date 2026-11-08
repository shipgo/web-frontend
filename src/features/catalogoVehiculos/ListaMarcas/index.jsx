import { Card, Flex, Pagination, Text } from "@mantine/core";
import { Fragment } from "react";

import PageContainer from "@components/PageContainer";
import ResponsiveList from "@components/ResponsiveList";
import ListCard from "@components/ListCard";
import ResultsCounter from "@components/ResultsCounter";
import RowActionsMenu from "@components/RowActionsMenu";
import { useIsMobile } from "@hooks/useIsMobile";

import { useCsvExport } from "@hooks/useCsvExport";
import { listaEstados } from "@copy/common";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useLocation } from "wouter";

import CatalogoVehiculosHeader from "../components/CatalogoVehiculosHeader";
import ListaMarcasFiltros from "./components/ListaMarcasFiltros";
import ListaMarcasTabla from "./components/ListaMarcasTabla";
import { useDeleteMarca } from "./hooks/useDeleteMarca";

import { useGetMarcas } from "./hooks/useGetMarcas";
import { MARCAS_CSV_COLUMNS } from "./listaMarcas.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'marca', plural: 'marcas', genero: 'f' });

const PAGE_LIMIT = 10;

const renderCard = (item, { actions }) => (
  <ListCard title={item.nombre || "Sin nombre"} actions={actions} />
);

const ListaMarcas = () => {
  const {
    data,
    isError,
    isLoading,
    refetchMarcas,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetMarcas(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: MARCAS_CSV_COLUMNS,
    entidad: "marcas",
    entidadLabel: "marcas",
  });

  const showPagination = data.total > PAGE_LIMIT;

  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { openDeleteModal } = useDeleteMarca(refetchMarcas);
  const ListWrapper = isMobile ? Fragment : Card;

  const getActions = (item) => (
    <RowActionsMenu
      ariaLabel={`Acciones de ${item.nombre || "Sin nombre"}`}
      actions={[
        {
          label: "Editar",
          color: "blue",
          icon: <IconEdit size={18} />,
          onClick: () => navigate(`/marcas/${item.id}/editar`),
        },
        {
          label: "Eliminar",
          color: "red",
          icon: <IconTrash size={18} />,
          onClick: () => openDeleteModal(item),
        },
      ]}
    />
  );

  return (
    <PageContainer>
      <CatalogoVehiculosHeader
        active="marcas"
        title="Marcas"
        subtitle="Administrá las marcas de vehículos"
        createLabel="Crear marca"
        createHref="/marcas/crear"
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaMarcasFiltros onFiltersChange={setFilters} resultsCount={data.total} />

      <ListWrapper>
        <ResponsiveList
          items={data.results}
          getActions={getActions}
          renderCard={renderCard}
          onLoading={{ show: isLoading, description: "Cargando marcas..." }}
          onError={{
            show: isError,
            onClick: refetchMarcas,
            title: ESTADOS_LISTA.error,
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: ESTADOS_LISTA.vacioTitulo,
            description: ESTADOS_LISTA.vacioDescripcion,
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: ESTADOS_LISTA.sinResultadosTitulo,
            description: ESTADOS_LISTA.sinResultadosDescripcion,
          }}
        >
          <ListaMarcasTabla items={data.results} onRefresh={refetchMarcas} />
        </ResponsiveList>
      </ListWrapper>

      {isMobile ? (
        <ResultsCounter
          amount={data.total}
          limit={PAGE_LIMIT}
          currentPage={page}
          isLoading={isLoading}
          onRefresh={refetchMarcas}
          onPageChange={setPage}
          totalPages={Math.ceil(data.total / PAGE_LIMIT) || 1}
        />
      ) : (
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
      )}
    </PageContainer>
  );
};

export default ListaMarcas;
