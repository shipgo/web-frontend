import { modals } from '@mantine/modals';
import { AppShellFooter, Button, Group, Text } from '@mantine/core'

import { useLocation } from 'wouter';

const EnvioFormActions = ({ lastStep, currentStep, handlePreviousStep, handleNextStep, handleOnSubmit }) => {
  const [, navigate] = useLocation();

  const showNextButton = currentStep < lastStep;
  const showFinishButton = currentStep === lastStep;
  const disableBackButton = currentStep === 0;

  const openConfirmationModal = () => modals.openConfirmModal({
    title: '¿Estás seguro?',
    labels: { confirm: 'Sí, estoy seguro', cancel: 'Volver' },
    onConfirm: () => navigate('/'),
    centered: true,
    children: (
      <Text>
        Si cancelas el registro, se perderán todos los datos ingresados.
      </Text>
    ),
  });

  return (
    <AppShellFooter>
      <Group
        gap="sm"
        h="100%"
        px="lg"
        m="auto"
        maw="1440"
        align="center"
        justify="flex-end"
      >
        <Button
          size="md"
          mr="auto"
          color='red'
          variant="light"
          onClick={openConfirmationModal}
        >
          Cancelar
        </Button>

        <Button
          size="md"
          variant="light"
          disabled={disableBackButton}
          onClick={handlePreviousStep}
        >
          Atrás
        </Button>

        {showNextButton && (
          <Button
            size="md"
            variant="light"
            onClick={handleNextStep}
          >
            Siguiente
          </Button>
        )}

        {showFinishButton && (
          <Button size="md" onClick={handleOnSubmit}>
            Registrar envío
          </Button>
        )}
      </Group>
    </AppShellFooter>
  )
};

export default EnvioFormActions