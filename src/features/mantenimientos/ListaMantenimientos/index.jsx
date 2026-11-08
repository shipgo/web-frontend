import { Fragment, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
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
import { useCsvExport } from "@hooks/useCsvExport";
import { useExportSelectedCsv } from "@hooks/useExportSelectedCsv";
import { listaEstados } from "@copy/common";
import { EMPTY } from "@domain/format";
import { timeFromNow, toLocalDateTime } from "@utils/dates";

import { mantenimientoApi } from "../api/mantenimientos.api";

import ListaMantenimientosHeader from "./components/ListaMantenimientosHeader";
import ListaMantenimientosFiltros from "./components/ListaMantenimientosFiltros";
import ListaMantenimientosTabla from "./components/ListaMantenimientosTabla";
import { getActionsForRow } from "./components/actions";

import { useDeleteMantenimiento } from "./hooks/useDeleteMantenimiento";
import { useGetMantenimientos } from "./hooks/useGetMantenimientos";
import { MANTENIMIENTOS_CSV_COLUMNS } from "./listaMantenimientos.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'mantenimiento', plural: 'mantenimientos', genero: 'm' });

const PAGE_LIMIT = 10;

const renderCard = (item, { selected, onToggle, actions }) => {
  const patente = item.vehiculo?.patente ?? "-";
  const mecanico = `${item.nombreMecanico ?? ""} ${item.apellidoMecanico ?? ""}`.trim() || "-";
  const fecha = item.fechaHoraMantenimiento;
  const fin = item.fechaHoraFin;

  return (
    <ListCard
      title={patente}
      mono
      badge={item.tipoMantenimiento?.nombre ? { label: item.tipoMantenimiento.nombre } : undefined}
      selected={selected}
      onToggle={onToggle}
      selectLabel={`Seleccionar ${patente}`}
      actions={actions}
      lines={[
        { label: "Mecánico", value: mecanico },
        {
          label: "Período",
          value: fecha ? `${toLocalDateTime(fecha)}${fin ? ` a ${toLocalDateTime(fin)}` : ""}` : EMPTY,
        },
        { label: "Sucursal", value: item.sucursal?.nombre ?? "-" },
      ]}
      footer={fecha ? timeFromNow(fecha) : undefined}
    />
  );
};

const ListaMantenimientos = () => {
  // "Historial mantenimiento" (SHG-FE-098) llega desde `ListaVehiculosTabla` /
  // `DetalleVehiculo` como `/mantenimientos?patente=<patente>`. Se lee acá
  // (una sola vez, al montar) para que el primer fetch salga ya filtrado en
  // vez de pedir todo y recién después re-pedir con `patente` — evita el
  // doble fetch que salía de aplicar el filtro en un `useEffect` posterior
  // en `ListaMantenimientosFiltros`. Limitación conocida: si el query param
  // cambia sin desmontar/remontar la pantalla (ej: navegar de un vehículo a
  // otro sin volver a `/mantenimientos`), el filtro no se actualiza solo.
  const patenteFromUrl = new URLSearchParams(useSearch()).get("patente")?.trim() || "";
  const initialFilters = patenteFromUrl
    ? { patente: { label: "patente", values: patenteFromUrl } }
    : {};

  const {
    data,
    isError,
    isLoading,
    refetchMantenimientos,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetMantenimientos(PAGE_LIMIT, initialFilters);

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

  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: MANTENIMIENTOS_CSV_COLUMNS,
    entidad: "mantenimientos-seleccionados",
    entidadLabel: "mantenimientos",
  });

  const { confirmBulkDelete } = useBulkDelete({
    deleteFn: (id) => mantenimientoApi.delete(id),
    singular: "mantenimiento",
    plural: "mantenimientos",
    getLabel: (item) => {
      const patente = item.vehiculo?.patente;
      const tipo = item.tipoMantenimiento?.nombre;
      return [tipo, patente].filter(Boolean).join(" · ") || `mantenimiento #${item.id}`;
    },
    onSettled: () => {
      refetchMantenimientos();
      selectedIds.clear();
    },
  });

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

  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteMantenimiento(refetchMantenimientos);
  const ListWrapper = isMobile ? Fragment : Card;

  const getActions = (item) => (
    <RowActionsMenu
      actions={getActionsForRow({
        onVerDetalles: () => navigate(`~/mantenimientos/${item.id}`),
        onEditar: () => navigate(`~/mantenimientos/${item.id}/editar`),
        onEliminar: () => confirmDelete(item),
      })}
      width={160}
      ariaLabel={`Acciones de ${item.vehiculo?.patente ?? "-"}`}
    />
  );

  return (
    <PageContainer>
      <ListaMantenimientosHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaMantenimientosFiltros
        onFiltersChange={setFilters}
        initialPatente={patenteFromUrl}
        resultsCount={data.total}
      />

      <SelectionBanner
        count={selectedIds.size}
        singular="mantenimiento seleccionado"
        plural="mantenimientos seleccionados"
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
          onLoading={{ show: isLoading, description: "Cargando mantenimientos..." }}
          onError={{
            show: isError,
            onClick: refetchMantenimientos,
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
          <ListaMantenimientosTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetchMantenimientos}
          />
        </ResponsiveList>
      </ListWrapper>

      {isMobile ? (
        <ResultsCounter
          amount={data.total}
          limit={PAGE_LIMIT}
          currentPage={page}
          isLoading={isLoading}
          onRefresh={refetchMantenimientos}
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

export default ListaMantenimientos;
