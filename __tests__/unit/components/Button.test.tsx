/**
 * Component unit tests — Button UI primitive
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/ui/Button";

describe("Button component", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled").closest("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByText("Disabled"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders primary variant with indigo classes", () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn.className).toContain("bg-indigo-600");
  });

  it("renders secondary variant with border", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn.className).toContain("border");
  });

  it("renders danger variant with red classes", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn.className).toContain("bg-red-600");
  });

  it("renders as a button element", () => {
    const { container } = render(<Button>Test</Button>);
    expect(container.firstChild?.nodeName).toBe("BUTTON");
  });

  it("forwards type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText("Submit").closest("button")).toHaveAttribute("type", "submit");
  });
});
