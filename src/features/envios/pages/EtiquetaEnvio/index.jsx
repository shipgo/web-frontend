import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Alert, Box, Button } from '@mantine/core';
import { IconArrowLeft, IconInfoCircle, IconPrinter } from '@tabler/icons-react';

import PageContainer from '@components/PageContainer';
import PageBreadcrumbsHeader from '@components/PageBreadcrumbsHeader';
import ScreenContainer from '@components/ScreenContainer';
import { isNotFoundError } from '@utils/httpErrors';
import { envioApi } from '@api';

import EtiquetaEnvio from './components/EtiquetaEnvio';

const EtiquetaEnvioPage = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [envio, setEnvio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadEnvio = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(false);
      setNotFound(false);
      setEnvio(await envioApi.getById(id));
    } catch (err) {
      if (isNotFoundError(err)) {
        setEnvio(null);
        setNotFound(true);
      } else {
        console.error('Error cargando envío:', err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEnvio();
  }, [loadEnvio]);

  const tieneCodigo = !!envio?.codigoSeguimiento;

  return (
    <PageContainer>
      {notFound && !loading && <PageBreadcrumbsHeader entidad="Envíos" accion="Etiqueta" />}
      <ScreenContainer
        onLoading={{ show: loading, description: 'Cargando envío...' }}
        onNotFound={{
          show: notFound && !loading,
          recurso: 'Envío',
          listaHref: '~/envios',
          listaLabel: 'Volver a envíos',
        }}
        onError={{
          show: error && !loading,
          title: 'No se pudo cargar el envío',
          description: 'Ocurrió un error al obtener la información del envío.',
          onClick: loadEnvio,
        }}
        onEmptyData={{
          show: !loading && !error && !notFound && !envio,
          title: 'Envío no encontrado',
          description: 'No encontramos información para este envío.',
        }}
      >
        {envio && (
          <>
            <PageBreadcrumbsHeader
              entidad="Envíos"
              accion="Etiqueta"
              descripcion={tieneCodigo ? `Código de seguimiento: ${envio.codigoSeguimiento}` : `Envío #${id}`}
            >
              <Button
                variant="default"
                leftSection={<IconArrowLeft size={18} />}
                onClick={() => navigate(`~/envios/${id}`)}
              >
                Volver
              </Button>
              {tieneCodigo && (
                <Button leftSection={<IconPrinter size={18} />} onClick={() => window.print()}>
                  Imprimir
                </Button>
              )}
            </PageBreadcrumbsHeader>

            {tieneCodigo ? (
              <Box style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
                <EtiquetaEnvio envio={envio} />
              </Box>
            ) : (
              <Alert color="yellow" variant="light" icon={<IconInfoCircle size={18} />} title="Sin código de seguimiento">
                Este envío no tiene código de seguimiento, por lo que no se puede generar la etiqueta.
              </Alert>
            )}
          </>
        )}
      </ScreenContainer>
    </PageContainer>
  );
};

export default EtiquetaEnvioPage;
