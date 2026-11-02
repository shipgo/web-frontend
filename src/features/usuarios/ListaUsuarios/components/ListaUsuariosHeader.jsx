import PageHeader from '@components/PageHeader';
import ExportCsvButton from '@components/ExportCsvButton';

import ListaUsuariosCrearUser from './ListaUsuariosCrearUser';

const ListaUsuariosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader title="Usuarios" subtitle="Administrá los usuarios de la plataforma">
    <ListaUsuariosCrearUser />
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaUsuariosHeader;
