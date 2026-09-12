import { useForm, FormProvider } from "./EnviosFormContext";
import { INITIAL_VALUES, validate } from "./enviosFormConfig";

const EnviosFormProvider = ({ children }) => {
  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate,
  });

  return <FormProvider form={form}>{children}</FormProvider>;
};

export default EnviosFormProvider;
