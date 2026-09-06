import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
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
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [envio, setEnvio] = useState(null);
  const [categorias, setCategorias] = useState([]);

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
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    envioApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setEnvio(data);
      })
      .catch((error) => {
        console.error("Error cargando envío:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del envío",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/envios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading || !envio) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando envío...</Text>
        </Card>
      </PageContainer>
    );
  }

  if (esEstadoTerminal("envio", envio.estado)) {
    return <EnvioNoEditable estado={envio.estado} />;
  }

  return <EditarEnvioForm id={id} envio={envio} categorias={categorias} />;
};

export default EditarEnvio;
