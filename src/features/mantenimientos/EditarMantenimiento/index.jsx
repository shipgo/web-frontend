import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { mantenimientoApi } from "../api/mantenimientos.api";

import EditarMantenimientoForm from "./components/EditarMantenimientoForm";

/**
 * Carga el mantenimiento y delega en `EditarMantenimientoForm`, que monta el
 * form una sola vez con los `initialValues` ya resueltos (mismo patrón que
 * `EditarEnvio` — `SHG-FE-031`).
 */
const EditarMantenimiento = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [mantenimiento, setMantenimiento] = useState(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    mantenimientoApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setMantenimiento(data);
      })
      .catch((error) => {
        console.error("Error cargando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar el mantenimiento",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/mantenimientos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading || !mantenimiento) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando mantenimiento...</Text>
        </Card>
      </PageContainer>
    );
  }

  return <EditarMantenimientoForm id={id} mantenimiento={mantenimiento} />;
};

export default EditarMantenimiento;
