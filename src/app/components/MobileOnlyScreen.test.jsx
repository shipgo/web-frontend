import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockLogout = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: (selector) => selector({ logout: mockLogout }),
}));

import MobileOnlyScreen from "./MobileOnlyScreen";

describe("MobileOnlyScreen", () => {
  beforeEach(() => {
    mockLogout.mockReset();
  });

  it("muestra el mensaje de 'usá la app móvil' sin navbar de gestión", () => {
    renderWithProviders(<MobileOnlyScreen />);

    expect(screen.getByText(/usá la app móvil/i)).toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
    expect(screen.queryByText("Sucursales")).not.toBeInTheDocument();
  });

  it("permite cerrar sesión desde la pantalla", async () => {
    renderWithProviders(<MobileOnlyScreen />);

    await userEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
