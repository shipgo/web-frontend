import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";

import SeccionEnvios from "./SeccionEnvios";
import SeccionRecursos from "./SeccionRecursos";
import SeccionResumen from "./SeccionResumen";
import SeccionDetalles from "./SeccionDetalles";
import { SeccionesAcordeon } from "./SeccionPlegable";

import EnviosFormProvider from "./contexts/EnviosFormProvider";
import Footer from "./Footer";

const CrearViaje = () => {
  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Viajes"
        accion="Crear nuevo viaje"
        descripcion="Completá las secciones para crear un viaje"
      />

      <EnviosFormProvider>
        <SeccionesAcordeon valoresAbiertos={["detalles", "envios", "recursos"]}>
          <SeccionDetalles />
          <SeccionEnvios />
          <SeccionRecursos />
        </SeccionesAcordeon>
        <SeccionResumen />
        <Footer />
      </EnviosFormProvider>
    </PageContainer>
  );
};

export default CrearViaje;
