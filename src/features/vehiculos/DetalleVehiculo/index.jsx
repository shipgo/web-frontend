import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { IconEdit, IconTool } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import RecursoNoEncontrado from "@components/RecursoNoEncontrado";
import { isNotFoundError } from "@utils/httpErrors";
import { vehiculoApi } from "@api";

import VehiculoPerfil from "../components/VehiculoPerfil";

const DetalleVehiculo = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadVehiculo = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await vehiculoApi.getById(id);
        setVehiculo(data);
      } catch (error) {
        if (isNotFoundError(error)) {
          setNotFound(true);
          return;
        }
        console.error("Error cargando vehículo:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del vehículo",
          color: "red",
        });
        navigate("~/vehiculos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVehiculo();
    }
  }, [id, navigate]);

  if (notFound) {
    return (
      <PageContainer>
        <PageBreadcrumbsHeader entidad="Vehículos" accion="Detalle de vehículo" />
        <RecursoNoEncontrado recurso="Vehículo" listaHref="~/vehiculos" listaLabel="Volver a vehículos" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Vehículos"
        accion="Detalle de vehículo"
        descripcion={vehiculo ? `Patente ${vehiculo.patente}` : undefined}
      >
        <Button
          leftSection={<IconEdit size={18} />}
          onClick={() => navigate(`~/vehiculos/${id}/editar`)}
        >
          Editar
        </Button>
        {vehiculo?.patente && (
          <Button
            variant="default"
            leftSection={<IconTool size={18} />}
            onClick={() =>
              navigate(`~/mantenimientos?patente=${encodeURIComponent(vehiculo.patente)}`)
            }
          >
            Ver mantenimientos
          </Button>
        )}
      </PageBreadcrumbsHeader>

      {loading ? (
        <Card>
          <Text c="dimmed">Cargando vehículo...</Text>
        </Card>
      ) : (
        <VehiculoPerfil vehiculo={vehiculo} showAllInfo={true} />
      )}
    </PageContainer>
  );
};

export default DetalleVehiculo;
