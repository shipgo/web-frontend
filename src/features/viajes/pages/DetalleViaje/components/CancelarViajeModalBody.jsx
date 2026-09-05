import { useState } from 'react';

import { Button, Group, Stack, Text, Textarea } from '@mantine/core';

/**
 * Contenido del modal de confirmación de "Cancelar viaje" (`SHG-FE-012`).
 * El motivo es opcional (`CancelarViajeReqDTO.motivo`, SHG-BE-009): se manda
 * sólo si el usuario escribió algo.
 */
const CancelarViajeModalBody = ({ id, onCancelar, onVolver }) => {
  const [motivo, setMotivo] = useState('');

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
        <Button variant="default" onClick={onVolver}>
          Volver
        </Button>
        <Button color="red" onClick={() => onCancelar(motivo)}>
          Cancelar viaje
        </Button>
      </Group>
    </Stack>
  );
};

export default CancelarViajeModalBody;
