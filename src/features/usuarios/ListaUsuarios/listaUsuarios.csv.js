import { rolLabel } from '@domain/roles';
import { nombreCompleto } from '@domain/usuario';
import { toLocalDate } from '@utils/dates';

const fechaRegistro = (u) => u.fechaCreacion || u.createdAt || u.fecha || null;

const rolesUsuario = (u) =>
  (u.authorities ?? []).map(rolLabel).filter(Boolean).join(', ');

/** Columnas del CSV de usuarios. */
export const USUARIOS_CSV_COLUMNS = [
  { header: 'Usuario', value: (u) => u.username },
  { header: 'Nombre', value: (u) => nombreCompleto(u) },
  { header: 'Email', value: (u) => u.email },
  { header: 'Rol', value: rolesUsuario },
  { header: 'Sucursal', value: (u) => u.sucursal?.nombre },
  { header: 'Fecha de registro', value: (u) => toLocalDate(fechaRegistro(u)) },
];
