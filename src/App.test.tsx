import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders title, step indicator, and preview area", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Palette Theme Generator" })).toBeInTheDocument();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
    expect(screen.getByText("팔레트 선택")).toBeInTheDocument();
    expect(screen.getByText("미리보기")).toBeInTheDocument();
    expect(screen.getByText("내보내기")).toBeInTheDocument();
  });

  it("renders all preset palette buttons", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Grape Night" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oxide Lime" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cold Signal" })).toBeInTheDocument();
  });

  it("download button is enabled when preset palette is active", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeEnabled();
  });

  it("disables download and shows validation error for invalid HEX input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Color 1");
    await user.clear(input);
    await user.type(input, "#XYZXYZ");
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeDisabled();
    expect(screen.getByText("입력 확인 필요")).toBeInTheDocument();
  });

  it("renders dark mode toggle button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });
});
