/**
 * Component unit tests — Modal UI primitive
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/ui/Modal";

describe("Modal component", () => {
  it("renders nothing when isOpen is false", () => {
    render(
      <Modal isOpen={false} title="Test Modal" onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders content when isOpen is true", () => {
    render(
      <Modal isOpen title="Test Modal" onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(
      <Modal isOpen title="My Modal Title" onClose={jest.fn()}>
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByText("My Modal Title")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen title="Close Test" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );
    fireEvent.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen title="Escape Test" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen title="Backdrop Test" onClose={onClose}>
        <p>Body</p>
      </Modal>
    );
    // The backdrop is the div with aria-hidden="true"
    const backdrop = container.querySelector("[aria-hidden='true']") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has aria-modal attribute set to true", () => {
    render(
      <Modal isOpen title="Aria Test" onClose={jest.fn()}>
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});
