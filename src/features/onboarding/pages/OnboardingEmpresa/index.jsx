import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, schemaResolver } from "@mantine/form";
import { Card, Group, Stack, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBriefcase, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { empresaApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import SucursalForm from "@features/sucursales/components/SucursalForm";
import {
  EMPRESA_ONBOARDING_INITIAL_VALUES,
  EMPRESA_ONBOARDING_SCHEMA,
  buildEmpresaReqDTO,
  remapEmpresaFieldErrors,
} from "../../constants/schema";

/**
 * "Configurá tu empresa" (SHG-FE-116, `CONTRACTS.md §16.1`): un SUPERUSER sin
 * empresa crea la empresa y su primera sucursal con `POST /api/empresa`. La
 * respuesta es el `UserDTO` del usuario ya vinculado: se vuelca a la sesión con
 * `setUser` (así la guarda de `ProtectedRoutes` deja de verlo "sin empresa") y se
 * invalida el contexto operativo (sucursales / empresa) antes de entrar al panel.
 */
const OnboardingEmpresa = () => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  // Guarda contra doble submit: `loading` es estado y se aplica en el próximo
  // render, un segundo clic dentro del mismo tick lo pasaría.
  const submittingRef = useRef(false);

  const form = useForm({
    mode: "controlled",
    initialValues: EMPRESA_ONBOARDING_INITIAL_VALUES,
    validate: schemaResolver(EMPRESA_ONBOARDING_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);

      try {
        const user = await empresaApi.save(buildEmpresaReqDTO(values));

        setUser(user);
        await queryClient.invalidateQueries({ queryKey: ["operating-context"] });

        notifications.show({
          title: "Empresa creada",
          message: "Tu empresa y su primera sucursal ya están listas",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("/", { replace: true });
      } catch (error) {
        console.error("Error creando la empresa:", error);

        const message = applyApiError(form, remapEmpresaFieldErrors(error), {
          stripPrefix: ["sucursal.puntoEntrega", "sucursal"],
          fallbackMessage: "No se pudo crear la empresa",
        });

        notifications.show({
          title: "Error",
          message,
          color: "red",
          icon: <IconX />,
        });
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [form, navigate, queryClient, setUser],
  );

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Empresa"
        accion="Configurá tu empresa"
        descripcion="Antes de operar, cargá los datos de tu empresa y de su primera sucursal"
      />

      <SucursalForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => {}}
        hideCancel
        submitLabel="Crear empresa"
        beforeSections={
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconBriefcase size={20} />
                <Title order={4}>Información de la empresa</Title>
              </Group>

              <TextInput
                label="Nombre de la empresa"
                placeholder="Ej: Mi Empresa S.R.L."
                leftSection={<IconBriefcase size={18} />}
                required
                {...form.getInputProps("empresaNombre")}
              />
            </Stack>
          </Card>
        }
      />
    </PageContainer>
  );
};

export default OnboardingEmpresa;
