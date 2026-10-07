import { useRef, useState } from 'react';

import { Button, Group, Stack, Text, Textarea } from '@mantine/core';

/**
 * Contenido del modal de confirmación de "Cancelar viaje" (`SHG-FE-012`).
 * El motivo es opcional (`CancelarViajeReqDTO.motivo`, SHG-BE-009): se manda
 * sólo si el usuario escribió algo.
 */
const CancelarViajeModalBody = ({ id, onCancelar, onVolver }) => {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // El ref cierra la ventana entre el primer click y el re-render con `disabled`:
  // un doble click rápido no debe mandar dos `PUT /cancelar`.
  const submittedRef = useRef(false);

  const handleCancelar = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await onCancelar(motivo);
    } finally {
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="sm">
      <Text size="sm">
        ¿Estás seguro de que deseas cancelar el viaje <strong>#{id}</strong>? Esta acción no se puede
        deshacer.
      </Text>
      <Textarea
        label="Motivo (opcional)"
        placeholder="Ej: vehículo con desperfecto mecánico"
        rows={2}
        value={motivo}
        onChange={(event) => setMotivo(event.currentTarget.value)}
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onVolver} disabled={submitting}>
          Volver
        </Button>
        <Button color="red" onClick={handleCancelar} loading={submitting}>
          Cancelar viaje
        </Button>
      </Group>
    </Stack>
  );
};

export default CancelarViajeModalBody;
