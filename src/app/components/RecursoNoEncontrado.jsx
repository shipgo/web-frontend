import { Link } from 'wouter';
import { IconFilesOff } from '@tabler/icons-react';
import { Button, Card, EmptyState } from '@mantine/core';

/**
 * Estado "no encontrado" de Detalle/Editar de cualquier entidad (SHG-FE-104):
 * dice que el recurso no existe y linkea al listado, SIN "Reintentar" (un 404
 * no se arregla reintentando).
 *
 * @param {Object} props
 * @param {string} props.recurso - nombre singular para el título (ej: "Envío").
 * @param {string} props.listaHref - destino del listado; usar `~/…` dentro de
 *   routers anidados (ej: "~/envios").
 * @param {string} props.listaLabel - texto del botón (ej: "Volver a envíos").
 * @param {string} [props.descripcion]
 * @param {string} [props.className]
 * @param {Object} [props.styleProps]
 */
const RecursoNoEncontrado = ({ recurso, listaHref, listaLabel, descripcion, className, styleProps }) => (
  <EmptyState
    mih='17rem'
    component={Card}
    shadow='none'
    bg='var(--mantine-color-body)'
    radius='0'
    className={className}
    style={{ justifyContent: 'center' }}
    {...styleProps}
  >
    <EmptyState.Indicator>
      <IconFilesOff size={50} color='var(--mantine-color-dimmed)' />
    </EmptyState.Indicator>
    <EmptyState.Title>{recurso} no encontrado</EmptyState.Title>
    <EmptyState.Description>
      {descripcion ?? `Este ${recurso.toLowerCase()} no existe o no tenés acceso a él.`}
    </EmptyState.Description>
    <EmptyState.Actions>
      <Button component={Link} to={listaHref} variant='light'>
        {listaLabel}
      </Button>
    </EmptyState.Actions>
  </EmptyState>
);

export default RecursoNoEncontrado;
