import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders title, controls, and preview area", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Palette Theme Generator" })).toBeInTheDocument();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
    expect(screen.getByText("Palette input")).toBeInTheDocument();
    expect(screen.getByText("Adjustments")).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Download ncp file" })).toBeEnabled();
  });

  it("disables download and shows validation error for invalid HEX input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Color 1");
    await user.clear(input);
    await user.type(input, "#XYZXYZ");
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Download ncp file" })).not.toBeInTheDocument();
    expect(screen.getByText("Invalid HEX color: #XYZXYZ")).toBeInTheDocument();
  });

  it("renders dark mode toggle button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("defaults to light mode and stores explicit dark mode preference", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("flstheme-generator.appearance.v1")).toBe("dark");
  });

  it("stores generated palette base colors in local history", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("기준 색상");
    await user.type(baseInput, "#89CFF0");
    await user.click(screen.getByRole("button", { name: "생성" }));

    expect(screen.getByText("최근 생성")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "생성 히스토리 #89CFF0" })).toBeInTheDocument();
    expect(window.localStorage.getItem("flstheme-generator.palette-history.v1")).toContain("#89CFF0");
  });

  it("keeps default global adjustment values visible", () => {
    render(<App />);

    expect(screen.getByText("Saturation").closest("div")).toHaveTextContent("256");
    expect(screen.getByText("Brightness").closest("div")).toHaveTextContent("132");
  });

  it("shows channel rack note swatches after global adjustments", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("기준 색상");
    await user.type(baseInput, "#FFB7CE");
    await user.click(screen.getByRole("button", { name: "생성" }));

    expect(screen.getByTitle("Note 0")).toHaveStyle({ backgroundColor: "#B82D5C" });
  });

  it("switches single-color generation to input-matched brightness", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("기준 색상");
    await user.type(baseInput, "#E8E5FF");
    await user.click(screen.getByRole("button", { name: "생성" }));

    expect(screen.getByText("Brightness").closest("div")).toHaveTextContent("128");
  });
});
