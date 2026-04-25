import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders shadcn-based palette controls and preview", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Palette Theme Generator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeEnabled();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
  });

  it("disables download and shows validation feedback for invalid HEX input", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("Color 1"));
    await user.type(screen.getByLabelText("Color 1"), "#XYZXYZ");

    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeDisabled();
    expect(screen.getByText("입력 확인 필요")).toBeInTheDocument();
  });
});
