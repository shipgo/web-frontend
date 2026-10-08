import { useEffect } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import { usuarioApi } from '@api';
import { useAuthStore } from '@stores/auth.store';
import { useBulkDelete } from '@hooks/useBulkDelete';
import { useCsvExport } from '@hooks/useCsvExport';
import { useExportSelectedCsv } from '@hooks/useExportSelectedCsv';

import ListaUsuariosHeader from './components/ListaUsuariosHeader';
import ListaUsuariosFiltros from './components/ListaUsuariosFiltros';
import ListaUsuariosTabla from './components/ListaUsuariosTabla';

import { useGetUsuarios } from './hooks/useGetUsuarios';
import { canManageUsuario } from '../utils';
import { USUARIOS_CSV_COLUMNS } from './listaUsuarios.csv';

const ListaUsuarios = () => {
  const { params, setPage, setFilters, refetch, usuariosQuery, fetchExportRows, PAGE_LIMIT } =
    useGetUsuarios();
  const { data = {}, isFetching: isLoading, isError } = usuariosQuery;
  const currentUser = useAuthStore((state) => state.user);

  // SHG-FE-094 / SHG-FE-095: nunca permitir que el usuario logueado se
  // auto-elimine (hard delete sin guarda de backend contra auto-borrado) —
  // mismo criterio que `isSelf` en `ListaUsuariosTabla.jsx`, que ya
  // deshabilita el checkbox de esa fila. Se repite el filtro acá antes de
  // `confirmBulkDelete` como defensa en profundidad, no confiar sólo en que
  // el checkbox nunca se haya podido tildar.
  const isSelf = (usuario) =>
    Boolean(currentUser?.id) && String(currentUser.id) === String(usuario.id);
  // SHG-FE-121: tampoco se seleccionan (ni borran) otros ADMIN/SUPERUSER si
  // quien mira es ADMIN.
  const isSelectable = (usuario) => !isSelf(usuario) && canManageUsuario(currentUser, usuario);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: USUARIOS_CSV_COLUMNS,
    entidad: 'usuarios',
    entidadLabel: 'usuarios',
  });

  const selectedIds = useSet();

  useEffect(() => {
    selectedIds.clear();
  }, [data.results]);

  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: USUARIOS_CSV_COLUMNS,
    entidad: 'usuarios-seleccionados',
    entidadLabel: 'usuarios',
  });

  const { confirmBulkDelete } = useBulkDelete({
    deleteFn: (id) => usuarioApi.delete(id),
    singular: 'usuario',
    plural: 'usuarios',
    getLabel: (item) =>
      item.nombre && item.apellido ? `${item.nombre} ${item.apellido}` : item.username,
    onSettled: () => {
      refetch();
      selectedIds.clear();
    },
  });

  const onToggle = (id) => selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  const onToggleAll = () => {
    // Excluye la propia fila: nunca es seleccionable (ver `isSelf` arriba).
    const seleccionables = (data.results ?? []).filter(isSelectable);
    if (seleccionables.length > 0 && seleccionables.every((i) => selectedIds.has(i.id))) {
      seleccionables.forEach((i) => selectedIds.delete(i.id));
    } else {
      seleccionables.forEach((i) => selectedIds.add(i.id));
    }
  };

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <ListaUsuariosHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaUsuariosFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="usuario seleccionado"
        plural="usuarios seleccionados"
        onClear={() => selectedIds.clear()}
        onExport={() => exportarSeleccionados(data.results, selectedIds)}
        onDelete={() =>
          confirmBulkDelete(
            (data.results ?? []).filter((item) => selectedIds.has(item.id) && isSelectable(item)),
          )
        }
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando usuarios...' }}
          onError={{ show: isError, onClick: refetch, description: 'Ocurrió un error al cargar los usuarios' }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: 'Sin usuarios que mostrar',
            description: 'Parece que no hay usuarios cargados todavía',
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: 'Sin resultados',
            description: 'No se encontraron usuarios con los filtros aplicados',
          }}
        >
          <ListaUsuariosTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetch}
          />
        </ScreenContainer>
      </Card>

      <Flex align="center">
        <Pagination
          value={params.page}
          onChange={setPage}
          total={Math.ceil(data.total / PAGE_LIMIT) || 1}
          disabled={!showPagination}
        />
        <Text c="dimmed" ml="auto">
          {data.total > 0
            ? `Mostrando ${(params.page - 1) * PAGE_LIMIT + 1} - ${Math.min(params.page * PAGE_LIMIT, data.total)} de ${data.total} resultados`
            : '0 resultados'}
        </Text>
      </Flex>
    </PageContainer>
  );
};

export default ListaUsuarios;
