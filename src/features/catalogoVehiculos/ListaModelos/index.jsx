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
import ListaModelosFiltros from "./components/ListaModelosFiltros";
import ListaModelosTabla from "./components/ListaModelosTabla";
import { useDeleteModelo } from "./hooks/useDeleteModelo";

import { useGetModelos } from "./hooks/useGetModelos";
import { MODELOS_CSV_COLUMNS } from "./listaModelos.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'modelo', plural: 'modelos', genero: 'm' });

const PAGE_LIMIT = 10;

const renderCard = (item, { actions }) => (
  <ListCard
    title={item.nombre || "Sin nombre"}
    actions={actions}
    lines={[
      { label: "Marca", value: item.marca?.nombre || "Sin marca" },
      { label: "Año", value: item.anio ?? "Sin año" },
    ]}
  />
);

const ListaModelos = () => {
  const {
    data,
    isError,
    isLoading,
    refetchModelos,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetModelos(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: MODELOS_CSV_COLUMNS,
    entidad: "modelos",
    entidadLabel: "modelos",
  });

  const showPagination = data.total > PAGE_LIMIT;

  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { openDeleteModal } = useDeleteModelo(refetchModelos);
  const ListWrapper = isMobile ? Fragment : Card;

  const getActions = (item) => (
    <RowActionsMenu
      ariaLabel={`Acciones de ${item.nombre || "Sin nombre"}`}
      actions={[
        {
          label: "Editar",
          color: "blue",
          icon: <IconEdit size={18} />,
          onClick: () => navigate(`/modelos/${item.id}/editar`),
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
        active="modelos"
        title="Modelos"
        subtitle="Administrá los modelos de vehículos"
        createLabel="Crear modelo"
        createHref="/modelos/crear"
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaModelosFiltros onFiltersChange={setFilters} resultsCount={data.total} />

      <ListWrapper>
        <ResponsiveList
          items={data.results}
          getActions={getActions}
          renderCard={renderCard}
          onLoading={{ show: isLoading, description: "Cargando modelos..." }}
          onError={{
            show: isError,
            onClick: refetchModelos,
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
          <ListaModelosTabla items={data.results} onRefresh={refetchModelos} />
        </ResponsiveList>
      </ListWrapper>

      {isMobile ? (
        <ResultsCounter
          amount={data.total}
          limit={PAGE_LIMIT}
          currentPage={page}
          isLoading={isLoading}
          onRefresh={refetchModelos}
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

export default ListaModelos;
