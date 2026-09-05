import { useState } from 'react';

import { Button, Group, Stack, Text, Textarea } from '@mantine/core';

/**
 * Contenido del modal de confirmación de "Marcar fallo de entrega" (`SHG-FE-007`).
 * A diferencia de "Cancelar viaje" (`SHG-FE-012`), acá el `motivo` es
 * **obligatorio** (`FalloEntregaEnvioReqDTO.motivo` `@NotEmpty`): el botón de
 * confirmación no envía nada hasta que el usuario escriba algo.
 */
const FalloEntregaModalBody = ({ id, onConfirmar, onVolver }) => {
  const [motivo, setMotivo] = useState('');
  const [tocado, setTocado] = useState(false);

  const motivoVacio = !motivo.trim();

  const handleConfirmar = () => {
    if (motivoVacio) {
      setTocado(true);
      return;
    }
    onConfirmar(motivo.trim());
  };

  return (
    <Stack gap="sm">
      <Text size="sm">
        ¿Confirmás que el envío <strong>#{id}</strong> no pudo ser entregado? Esta acción no se puede
        deshacer.
      </Text>
      <Textarea
        label="Motivo"
        placeholder="Ej: destinatario ausente"
        required
        rows={2}
        value={motivo}
        onChange={(event) => setMotivo(event.currentTarget.value)}
        error={tocado && motivoVacio ? 'El motivo es obligatorio' : null}
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onVolver}>
          Volver
        </Button>
        <Button color="red" onClick={handleConfirmar}>
          Marcar fallo de entrega
        </Button>
      </Group>
    </Stack>
  );
};

export default FalloEntregaModalBody;
