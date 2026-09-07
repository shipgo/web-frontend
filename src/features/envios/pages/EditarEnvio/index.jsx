import { useCallback, useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";
import { envioApi, categoriaApi } from "@api";
import { esEstadoTerminal } from "@domain/estados";

import EditarEnvioForm from "./components/EditarEnvioForm";
import EnvioNoEditable from "./components/EnvioNoEditable";

/**
 * Carga el envío + catálogos y delega en el form canónico (`EditarEnvioForm`,
 * comparte `EnvioFormProvider`/schema/secciones con `CrearEnvios` — `SHG-FE-031`).
 * Resuelve acá el estado de carga, el 404 y el gate de estado terminal
 * (`SHG-FE-004`) para que el form monte una sola vez con los `initialValues`
 * ya resueltos.
 */
const EditarEnvio = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [envio, setEnvio] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const loadEnvio = useCallback(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    envioApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setEnvio(data);
      })
      .catch((err) => {
        console.error("Error cargando envío:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    categoriaApi
      .getAll()
      .then((data) =>
        setCategorias(
          (data ?? []).map((c) => ({ value: String(c.id), label: c.nombre })),
        ),
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las categorías",
          color: "red",
          icon: <IconX />,
        });
      });
  }, []);

  useEffect(() => {
    const cleanup = loadEnvio();
    return cleanup;
  }, [loadEnvio]);

  return (
    <PageContainer>
      <ScreenContainer
        onLoading={{ show: loading, description: 'Cargando envío...' }}
        onError={{
          show: error && !loading,
          title: 'No se pudo cargar el envío',
          description: 'Ocurrió un error al obtener la información del envío.',
          onClick: loadEnvio,
        }}
        onEmptyData={{
          show: !loading && !error && !envio,
          title: 'Envío no encontrado',
          description: 'No encontramos información para este envío.',
        }}
      >
        {envio && (
          <>
            {esEstadoTerminal("envio", envio.estado) ? (
              <EnvioNoEditable estado={envio.estado} />
            ) : (
              <EditarEnvioForm id={id} envio={envio} categorias={categorias} />
            )}
          </>
        )}
      </ScreenContainer>
    </PageContainer>
  );
};

export default EditarEnvio;
