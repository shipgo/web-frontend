import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { FormProvider, useForm } from "../contexts/EnviosFormContext";
import useEnviosStats from "./useEnviosStats";

const wrapperWithEnviosIncluidos = (enviosIncluidos) => {
  const Wrapper = ({ children }) => {
    const form = useForm({
      initialValues: { enviosIncluidos },
    });
    return <FormProvider form={form}>{children}</FormProvider>;
  };
  return Wrapper;
};

describe("useEnviosStats", () => {
  it("cada entrada de enviosIncluidos cuenta como UNA parada, sin importar cuántos envíos tenga", () => {
    const enviosIncluidos = new Map([
      [
        "local_5",
        {
          puntoEntregaID: 5,
          sucursalDestinoID: null,
          label: "Calle Falsa 123",
          packages: new Map([
            [1, { id: 1, peso: 10 }],
            [2, { id: 2, peso: 5 }],
          ]),
        },
      ],
      [
        "sucursal_7",
        {
          puntoEntregaID: null,
          sucursalDestinoID: 7,
          label: "Sucursal Sur",
          packages: new Map([[3, { id: 3, peso: 3 }]]),
        },
      ],
    ]);

    const { result } = renderHook(() => useEnviosStats(), {
      wrapper: wrapperWithEnviosIncluidos(enviosIncluidos),
    });

    expect(result.current).toEqual({
      totalPackages: 3,
      totalStops: 2,
      pesoTotal: 18,
    });
  });

  it("sin envíos incluidos, todos los totales son 0", () => {
    const { result } = renderHook(() => useEnviosStats(), {
      wrapper: wrapperWithEnviosIncluidos(new Map()),
    });

    expect(result.current).toEqual({
      totalPackages: 0,
      totalStops: 0,
      pesoTotal: 0,
    });
  });
});
