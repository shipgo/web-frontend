import dayjs from "dayjs";

import { useForm, FormProvider } from "./EnviosFormContext";

const INITIAL_VALUES = {
  fechaHoraInicioPlanificada: null,
  fechaHoraFinPlanificada: null,
  enviosIncluidos: new Map(),
  vehiculo: null,
  choferes: [],
};

const validate = {
  fechaHoraInicioPlanificada: (value) =>
    !value ? "Seleccioná la fecha de salida planificada" : null,
  fechaHoraFinPlanificada: (value, values) => {
    if (!value) return "Seleccioná la fecha de llegada planificada";
    if (
      values.fechaHoraInicioPlanificada &&
      !dayjs(value).isAfter(dayjs(values.fechaHoraInicioPlanificada))
    ) {
      return "La llegada planificada debe ser posterior a la salida planificada";
    }
    return null;
  },
  enviosIncluidos: (value) =>
    !value || value.size === 0 ? "Agregá al menos un envío al viaje" : null,
  vehiculo: (value) => (!value ? "Seleccioná un vehículo" : null),
  choferes: (value) =>
    !value || value.length === 0 ? "Seleccioná al menos un chofer" : null,
};

const EnviosFormProvider = ({ children }) => {
  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate,
  });

  return <FormProvider form={form}>{children}</FormProvider>;
};

export default EnviosFormProvider;
