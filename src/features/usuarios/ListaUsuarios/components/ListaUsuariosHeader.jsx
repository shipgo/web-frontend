import PageHeader from '@components/PageHeader';

import ListaUsuariosCrearUser from './ListaUsuariosCrearUser';

const ListaUsuariosHeader = () => (
  <PageHeader title="Usuarios" subtitle="Listado de usuarios del sistema">
    <ListaUsuariosCrearUser />
  </PageHeader>
);

export default ListaUsuariosHeader;
