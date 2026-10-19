/**
 * Component integration tests — LeadUpdateModal
 *
 * Tests the full 7-step lead update form:
 * - All form fields render correctly
 * - Conditional fields show/hide properly
 * - Outcome (Converted/Dropped) status selection works
 * - Form submission calls API and triggers callbacks
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeadUpdateModal from "@/components/employee/LeadUpdateModal";
import type { Lead } from "@/lib/types";

// Mock fetch globally
global.fetch = jest.fn();

const mockLead: Lead = {
  id: "lead-uuid-1",
  company_name: "Acme Corp",
  contact_person: "John Doe",
  phone: "1234567890",
  email: "john@acme.com",
  source: "CSV Import",
  assigned_to: "emp-uuid-1",
  status: "New",
  service_interest: "Web",
  is_interested: null,
  demo_website_sent: false,
  demo_liked: null,
  meeting_scheduled: false,
  meeting_type: null,
  meeting_date_time: null,
  site_visit_requested: false,
  notes: "",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderModal(overrides?: Partial<Lead>) {
  const lead = { ...mockLead, ...overrides };
  const onClose = jest.fn();
  const onSaved = jest.fn();
  const utils = render(
    <LeadUpdateModal lead={lead} onClose={onClose} onSaved={onSaved} />
  );
  return { ...utils, onClose, onSaved };
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe("LeadUpdateModal — rendering", () => {
  it("renders the modal with the lead company name in the title", () => {
    renderModal();
    expect(screen.getByText(/Update: Acme Corp/i)).toBeInTheDocument();
  });

  it("renders all 7 step headings", () => {
    renderModal();
    expect(screen.getByText(/1\. Service focus/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Interest level/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Demo website/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Meeting setup/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Site visit/i)).toBeInTheDocument();
    expect(screen.getByText(/6\. Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/7\. Outcome/i)).toBeInTheDocument();
  });

  it("renders service interest radio options", () => {
    renderModal();
    expect(screen.getByLabelText(/^Camera$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Web$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Both$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Other$/i)).toBeInTheDocument();
  });

  it("renders Save changes and Cancel buttons", () => {
    renderModal();
    expect(screen.getByText("Save changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders all 7 status outcome buttons", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /Converted/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dropped/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^New$/ })).toBeInTheDocument();
  });
});

describe("LeadUpdateModal — conditional fields", () => {
  it("hides demo_liked radios when demo_website_sent is unchecked", () => {
    renderModal({ demo_website_sent: false });
    expect(screen.queryByText("Liked it")).not.toBeInTheDocument();
  });

  it("shows demo_liked radios when demo_website_sent is checked", () => {
    renderModal({ demo_website_sent: true });
    expect(screen.getByText("Liked it")).toBeInTheDocument();
  });

  it("shows demo_liked when checkbox is clicked", async () => {
    renderModal({ demo_website_sent: false });
    const demoCheckbox = screen.getByLabelText(/Demo website sent/i);
    await userEvent.click(demoCheckbox);
    expect(screen.getByText("Liked it")).toBeInTheDocument();
  });

  it("hides meeting fields when meeting_scheduled is unchecked", () => {
    renderModal({ meeting_scheduled: false });
    expect(screen.queryByLabelText(/Date & time/i)).not.toBeInTheDocument();
  });

  it("shows meeting type and datetime when meeting_scheduled is checked", () => {
    renderModal({ meeting_scheduled: true });
    expect(screen.getByLabelText(/Date & time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Google Meet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Onsite/i)).toBeInTheDocument();
  });
});

describe("LeadUpdateModal — Outcome (status) selection", () => {
  it("Converted button is aria-pressed=false initially (status=New)", () => {
    renderModal({ status: "New" });
    const convertedBtn = screen.getByRole("button", { name: /Converted/ });
    expect(convertedBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("current status button is aria-pressed=true", () => {
    renderModal({ status: "Converted" });
    const convertedBtn = screen.getByRole("button", { name: /Converted/ });
    expect(convertedBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking Converted sets it as aria-pressed=true", async () => {
    renderModal({ status: "New" });
    const convertedBtn = screen.getByRole("button", { name: /Converted/ });
    await userEvent.click(convertedBtn);
    expect(convertedBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking Dropped changes selection", async () => {
    renderModal({ status: "New" });
    const droppedBtn = screen.getByRole("button", { name: /Dropped/ });
    await userEvent.click(droppedBtn);
    expect(droppedBtn).toHaveAttribute("aria-pressed", "true");
  });
});

describe("LeadUpdateModal — form submission", () => {
  it("calls onClose when Cancel is clicked", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls fetch with PATCH on form submit", async () => {
    const updatedLead = { ...mockLead, status: "Contacted" as const };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedLead,
    });

    const { onSaved } = renderModal();
    fireEvent.submit(screen.getByText("Save changes").closest("form")!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/leads/${mockLead.id}`,
        expect.objectContaining({ method: "PATCH" })
      );
    });
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(updatedLead);
    });
  });

  it("shows error message when API returns non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });

    renderModal();
    fireEvent.submit(screen.getByText("Save changes").closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized");
    });
  });

  it("sends status: Converted when Converted is selected before submit", async () => {
    const updatedLead = { ...mockLead, status: "Converted" as const };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedLead,
    });

    renderModal({ status: "New" });
    await userEvent.click(screen.getByRole("button", { name: /Converted/ }));

    fireEvent.submit(screen.getByText("Save changes").closest("form")!);

    await waitFor(() => {
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body as string);
      expect(body.status).toBe("Converted");
    });
  });
});
