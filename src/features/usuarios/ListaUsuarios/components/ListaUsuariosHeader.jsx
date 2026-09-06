import PageHeader from '@components/PageHeader';
import ExportCsvButton from '@components/ExportCsvButton';

import ListaUsuariosCrearUser from './ListaUsuariosCrearUser';

const ListaUsuariosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader title="Usuarios" subtitle="Listado de usuarios del sistema">
    <ListaUsuariosCrearUser />
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaUsuariosHeader;
