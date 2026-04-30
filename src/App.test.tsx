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
    expect(screen.queryByText("Adjustments")).not.toBeInTheDocument();
  });

  it("starts without preset palette examples", () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: "Grape Night" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Oxide Lime" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cold Signal" })).not.toBeInTheDocument();
    expect(screen.getByText("0/6")).toBeInTheDocument();
  });

  it("keeps downloads disabled until a valid palette is active", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Download ncp file" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
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

    const baseInput = screen.getByLabelText("Base color");
    await user.type(baseInput, "#89CFF0");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "History entry #89CFF0" })).toBeInTheDocument();
    expect(window.localStorage.getItem("flstheme-generator.palette-history.v1")).toContain("#89CFF0");
  });

  it("deletes generated palette entries from local history", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("Base color");
    await user.type(baseInput, "#89CFF0");
    await user.click(screen.getByRole("button", { name: "Generate" }));
    await user.click(screen.getByRole("button", { name: "Delete history entry #89CFF0" }));

    expect(screen.queryByRole("button", { name: "History entry #89CFF0" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("flstheme-generator.palette-history.v1")).not.toContain("#89CFF0");
  });

  it("shows playlist audio clip preview after global adjustments", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("Base color");
    await user.type(baseInput, "#FFB7CE");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByTitle("Audio clip preview")).toBeInTheDocument();
  });

  it("keeps single-color generation usable after removing adjustment controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    const baseInput = screen.getByLabelText("Base color");
    await user.type(baseInput, "#E8E5FF");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeEnabled();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
  });
});
