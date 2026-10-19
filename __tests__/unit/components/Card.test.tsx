/**
 * Component unit tests — Card UI primitive
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Card from "@/components/ui/Card";

describe("Card component", () => {
  it("renders children", () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies default styling classes", () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-2xl");
    expect(el.className).toContain("bg-white");
  });

  it("merges additional className", () => {
    const { container } = render(<Card className="p-8">Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("p-8");
    expect(el.className).toContain("rounded-2xl");
  });

  it("renders as a div", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});
