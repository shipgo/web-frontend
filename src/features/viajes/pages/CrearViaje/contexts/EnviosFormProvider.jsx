import { useForm, FormProvider } from "./EnviosFormContext";

const INITIAL_VALUES = {
  fechaSalida: new Date(),
  sucursalOrigen: "Sucursal A",
  enviosIncluidos: new Map(),
  vehiculo: null,
  chofer: null,
  retornoOrigen: false,
};

const EnviosFormProvider = ({ children }) => {
  const form = useForm({
    initialValues: INITIAL_VALUES,
  });

  return <FormProvider form={form}>{children}</FormProvider>;
};

export default EnviosFormProvider;
