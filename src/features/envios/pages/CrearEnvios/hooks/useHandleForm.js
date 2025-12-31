import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

const FIRST_STEP = 0;

const useHandleForm = () => {
  const [currentStep, setCurrentStep] = useState(FIRST_STEP);

  const { mutate: sendForm, isPending } = useMutation({
    mutationFn: async (values) => {
      console.log(values);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      notifications.cleanQueue();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Atención",
        position: "bottom-center",
        message: "Hubo un error al crear el envío. Intenta nuevamente.",
      });
    },
    onSuccess: () => setCurrentStep((prevStep) => prevStep + 1),
  });

  const setNextStep = useCallback(() => {
    setCurrentStep((prevStep) => prevStep + 1);
  }, []);

  const setPreviousStep = useCallback(() => {
    setCurrentStep((prevStep) => {
      if (prevStep === FIRST_STEP) return prevStep;
      return prevStep - 1;
    });
  }, []);

  return {
    sendForm,
    isPending,
    currentStep,
    setNextStep,
    setPreviousStep,
  };
};

export default useHandleForm;
