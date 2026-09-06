import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";

import SeccionEnvios from "./SeccionEnvios";
import SeccionRecursos from "./SeccionRecursos";
import SeccionResumen from "./SeccionResumen";
import SeccionDetalles from "./SeccionDetalles";

import EnviosFormProvider from "./contexts/EnviosFormProvider";
import Footer from "./Footer";

const CrearViaje = () => {
  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Viajes"
        accion="Crear nuevo viaje"
        descripcion="Completa las secciones para crear un viaje"
      />

      <EnviosFormProvider>
        <SeccionDetalles />
        <SeccionEnvios />
        <SeccionRecursos />
        <SeccionResumen />
        <Footer />
      </EnviosFormProvider>
    </PageContainer>
  );
};

export default CrearViaje;
