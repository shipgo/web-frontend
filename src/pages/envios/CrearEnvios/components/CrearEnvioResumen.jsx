import { Alert, Box, Divider, Group, Paper, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import GridData from "@components/GridData";
import ScreenContainer from "@components/ScreenContainer";

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

const getCards = (form) =>
  [
    {
      title: "Destinatario",
      columnsCount: 2,
      content: [
        {
          label: "Nombre completo",
          value: form.nombre,
        },
        {
          label: "Correo",
          value: form.email,
          isFullWidth: true,
        },
        {
          label: "Documento",
          value: `${form.tipo_documento} ${form.numero_documento}`,
        },
      ],
    },
    {
      title: "Destino",
      columnsCount: 2,
      content: [
        {
          label: "Direccion",
          isFullWidth: true,
          value: `${form.calle} ${form.numero}`,
        },
        {
          label: "Localidad",
          value: form.localidad,
        },
        {
          label: "Provincia",
          value: form.provincia,
        },
        {
          label: "Codigo Postal",
          value: "5900",
        },
        {
          label: "Observaciones",
          value: form.comentario,
          isFullWidth: true,
        },
      ],
    },
    {
      title: "Paquetes",
      columnsCount: 2,
      content: [
        {
          label: "Cantidad",
          value: `${form.paquetes.length} paquetes`,
        },
        {
          label: "Peso total",
          value: `${form.paquetes.reduce((acc, { peso }) => acc + peso, 0)} kg`,
        },
      ],
    },
  ].map((card) => ({
    ...card,
    content: card.content.filter(({ value }) => String(value).trim() !== ""),
  }));

const CrearEnvioResumen = () => {
  const { values, submitting } = useEnvioFormContext();

  return (
    <ScreenContainer
      onLoading={{ show: submitting, description: "Generando envío..." }}
    >
      <Box>
        <Alert mb="lg" color="yellow" icon={<IconAlertCircle />}>
          Revisá todo antes de registrar el envío. Una vez que lo hagas, no
          podrás editarlo.
        </Alert>

        <Group align="stretch" grow>
          {getCards(values).map(({ title, content, columnsCount }) => (
            <Paper shadow="none" withBorder p="lg" key={title}>
              <Title order={4}>{title}</Title>

              <Divider my="xs" />

              <GridData items={content} columnsCount={columnsCount} />
            </Paper>
          ))}
        </Group>
      </Box>
    </ScreenContainer>
  );
};

export default CrearEnvioResumen;
