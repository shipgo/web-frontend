import { Fragment, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, Flex, Pagination, Text } from "@mantine/core";
import { useSet } from "@mantine/hooks";

import PageContainer from "@components/PageContainer";
import ResponsiveList from "@components/ResponsiveList";
import ListCard from "@components/ListCard";
import ResultsCounter from "@components/ResultsCounter";
import RowActionsMenu from "@components/RowActionsMenu";
import SelectionBanner from "@components/SelectionBanner";

import { useIsMobile } from "@hooks/useIsMobile";
import { useBulkDelete } from "@hooks/useBulkDelete";
import { useExportSelectedCsv } from "@hooks/useExportSelectedCsv";
import { listaEstados } from "@copy/common";

import { sucursalApi } from "../api/sucursales.api";

import ListaSucursalesHeader from "./components/ListaSucursalesHeader";
import ListaSucursalesFiltros from "./components/ListaSucursalesFiltros";
import ListaSucursalesTabla from "./components/ListaSucursalesTabla";
import { ACTIONS } from "./components/actions";

import { useDeleteSucursal } from "./hooks/useDeleteSucursal";
import { useGetSucursales } from "./hooks/useGetSucursales";
import { SUCURSALES_CSV_COLUMNS } from "./listaSucursales.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'sucursal', plural: 'sucursales', genero: 'f' });

const PAGE_LIMIT = 10;

const renderCard = (item, { selected, onToggle, actions }) => {
  const nombre = item.nombre || "Sin nombre";
  const punto = item.puntoEntrega || {};
  const direccion =
    punto.nombreCalle || punto.numeroCalle
      ? `${punto.nombreCalle || ""} ${punto.numeroCalle || ""}`.trim()
      : "Sin dirección";
  const provincia = punto.localidad?.provincia?.nombre || "Sin provincia";
  const telefono = item.prefijo
    ? `${item.prefijo} ${item.telefono || ""}`.trim()
    : item.telefono || "Sin teléfono";

  return (
    <ListCard
      title={nombre}
      selected={selected}
      onToggle={onToggle}
      selectLabel={`Seleccionar ${nombre}`}
      actions={actions}
      lines={[
        { label: "Dirección", value: direccion },
        { label: "Provincia", value: provincia },
        { label: "Teléfono", value: telefono },
      ]}
    />
  );
};

const ListaSucursales = () => {
  const {
    data,
    isError,
    isLoading,
    refetchSucursales,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetSucursales(PAGE_LIMIT);

  const selectedIds = useSet();

  useEffect(() => {
    selectedIds.clear();
  }, [data.results]);

  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: SUCURSALES_CSV_COLUMNS,
    entidad: "sucursales-seleccionadas",
    entidadLabel: "sucursales",
  });

  const { confirmBulkDelete } = useBulkDelete({
    deleteFn: (id) => sucursalApi.delete(id),
    singular: "sucursal",
    plural: "sucursales",
    getLabel: (item) => item.nombre || "Sin nombre",
    onSettled: () => {
      refetchSucursales();
      selectedIds.clear();
    },
  });

  const onToggle = (id) => (selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id));
  const onToggleAll = () => {
    if (data.results?.every((i) => selectedIds.has(i.id))) {
      data.results.forEach((i) => selectedIds.delete(i.id));
    } else {
      data.results?.forEach((i) => selectedIds.add(i.id));
    }
  };

  const showPagination = data.total > PAGE_LIMIT;

  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { openDeleteModal } = useDeleteSucursal(refetchSucursales);
  const ListWrapper = isMobile ? Fragment : Card;

  const handleAction = (label, item) => {
    if (label === "Ver detalles") navigate(`~/sucursales/${item.id}`);
    else if (label === "Editar") navigate(`~/sucursales/${item.id}/editar`);
    else if (label === "Eliminar") openDeleteModal(item);
  };

  const getActions = (item) => (
    <RowActionsMenu
      ariaLabel={`Acciones de ${item.nombre || "Sin nombre"}`}
      actions={ACTIONS.map(({ name, items }) => ({
        name,
        items: items.map((action) => ({ ...action, onClick: () => handleAction(action.label, item) })),
      }))}
    />
  );

  return (
    <PageContainer>
      <ListaSucursalesHeader />

      <ListaSucursalesFiltros onFiltersChange={setFilters} resultsCount={data.total} />

      <SelectionBanner
        count={selectedIds.size}
        singular="sucursal seleccionada"
        plural="sucursales seleccionadas"
        onClear={() => selectedIds.clear()}
        onExport={() => exportarSeleccionados(data.results, selectedIds)}
        onDelete={() => confirmBulkDelete((data.results ?? []).filter((item) => selectedIds.has(item.id)))}
      />

      <ListWrapper>
        <ResponsiveList
          items={data.results}
          selectedIds={selectedIds}
          onToggle={onToggle}
          getActions={getActions}
          renderCard={renderCard}
          onLoading={{ show: isLoading, description: "Cargando sucursales..." }}
          onError={{
            show: isError,
            onClick: refetchSucursales,
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
          <ListaSucursalesTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetchSucursales}
          />
        </ResponsiveList>
      </ListWrapper>

      {isMobile ? (
        <ResultsCounter
          amount={data.total}
          limit={PAGE_LIMIT}
          currentPage={page}
          isLoading={isLoading}
          onRefresh={refetchSucursales}
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

export default ListaSucursales;
