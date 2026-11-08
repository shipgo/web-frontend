import { useLocation } from 'wouter';
import { IconEdit, IconEye, IconKey, IconTrash } from '@tabler/icons-react';

import { useAuthStore } from '@stores/auth.store';
import { useDeleteUsuario } from './useDeleteUsuario';
import { usePasswordReset } from '../../hooks/usePasswordReset';
import { canManageUsuario } from '../../utils';

/**
 * Acciones por fila de la lista de usuarios, compartidas por la tabla (escritorio)
 * y las tarjetas (mobile).
 */
export const useUsuarioRowActions = (onRefresh) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteUsuario(onRefresh);
  const { confirmReset } = usePasswordReset();
  const currentUser = useAuthStore((state) => state.user);

  // SHG-FE-094 / SHG-FE-095: nunca ofrecer "Eliminar" (ni individual ni masivo)
  // sobre el propio usuario logueado.
  const isSelf = (usuario) =>
    Boolean(currentUser?.id) && String(currentUser.id) === String(usuario.id);
  // SHG-FE-121: un ADMIN no edita ni borra a otros ADMIN/SUPERUSER (404 del backend).
  const isManageable = (usuario) => canManageUsuario(currentUser, usuario);

  const getActions = (usuario) => {
    const self = isSelf(usuario);
    const manageable = isManageable(usuario);

    const actions = [
      { icon: <IconEye size={18} />, label: 'Ver detalles', onClick: () => navigate(`~/usuarios/${usuario.id}`) },
    ];
    if (manageable) {
      actions.push({ icon: <IconEdit size={18} />, label: 'Editar', color: 'blue', onClick: () => navigate(`~/usuarios/${usuario.id}/editar`) });
      actions.push({ icon: <IconKey size={18} />, label: 'Restablecer contraseña', color: 'orange', onClick: () => confirmReset(usuario) });
    }
    if (!self && manageable) {
      actions.push({
        icon: <IconTrash size={18} />,
        label: 'Eliminar',
        color: 'red',
        dividerBefore: true,
        onClick: () => confirmDelete(usuario),
      });
    }
    return actions;
  };

  return { getActions, isSelf, isManageable, currentUser };
};
