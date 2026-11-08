import { useState } from 'react';

import { Button, Group, Stack, Text, Textarea } from '@mantine/core';

import { useFieldSize } from '@components/useFieldSize';
import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Contenido del modal de confirmación de "Registrar entrega fallida" (`SHG-FE-007`).
 * A diferencia de "Cancelar viaje" (`SHG-FE-012`), acá el `motivo` es
 * **obligatorio** (`FalloEntregaEnvioReqDTO.motivo` `@NotEmpty`): el botón de
 * confirmación no envía nada hasta que el usuario escriba algo.
 */
const FalloEntregaModalBody = ({ id, onConfirmar, onVolver }) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
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
        ¿Confirmás que el envío <strong>#{id}</strong> no se pudo entregar? Esta acción no se puede
        deshacer.
      </Text>
      <Textarea
        size={size}
        label="Motivo"
        placeholder="Ej: destinatario ausente"
        required
        rows={2}
        value={motivo}
        onChange={(event) => setMotivo(event.currentTarget.value)}
        error={tocado && motivoVacio ? 'Ingresá el motivo.' : null}
      />
      <Group justify="flex-end" grow={isMobile}>
        <Button variant="default" size={size} onClick={onVolver}>
          Volver
        </Button>
        <Button color="red" size={size} onClick={handleConfirmar}>
          Registrar entrega fallida
        </Button>
      </Group>
    </Stack>
  );
};

export default FalloEntregaModalBody;
