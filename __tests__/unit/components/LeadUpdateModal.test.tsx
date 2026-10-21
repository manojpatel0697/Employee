import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeadUpdateModal from "@/components/employee/LeadUpdateModal";
import type { Lead } from "@/lib/types";

global.fetch = jest.fn();

const mockLead: Lead = {
  id: "lead-uuid-1", sl_no: "1", name: "Acme Corp", company_name: "Acme Corp",
  contact_person: "John Doe", phone: "1234567890", email: "john@acme.com",
  source: "XLSX Import", assigned_to: "emp-uuid-1",
  category: "Restaurant", search_category: "Restaurants",
  area: "MG Road", address: "123 MG Road", map_link: "https://maps.google.com",
  status: "New", service_interest: "Other",
  picked_up: false, call_status: null,
  is_interested: null, demo_website_sent: false, demo_liked: null,
  meeting_scheduled: false, meeting_type: null, meeting_date_time: null,
  site_visit_requested: false, notes: "",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

function renderModal(overrides?: Partial<Lead>) {
  const lead = { ...mockLead, ...overrides };
  const onClose = jest.fn();
  const onSaved = jest.fn();
  const utils = render(<LeadUpdateModal lead={lead} onClose={onClose} onSaved={onSaved} />);
  return { ...utils, onClose, onSaved };
}

beforeEach(() => (global.fetch as jest.Mock).mockClear());

describe("LeadUpdateModal — rendering", () => {
  it("renders lead name in title", () => {
    renderModal();
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
  });
  it("renders Step 1 — Did you call?", () => {
    renderModal();
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
  });
  it("does NOT show Step 2 until call is answered", () => {
    renderModal();
    expect(screen.queryByText(/Step 2/i)).not.toBeInTheDocument();
  });
  it("renders address and map link", () => {
    renderModal();
    expect(screen.getByText(/123 MG Road/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Maps/i)).toBeInTheDocument();
  });
  it("renders Save and Cancel buttons", () => {
    renderModal();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});

describe("LeadUpdateModal — conditional steps", () => {
  it("shows call status options after picking Yes, I called", async () => {
    renderModal();
    await userEvent.click(screen.getByLabelText(/Yes, I called/i));
    expect(screen.getByText("Answered")).toBeInTheDocument();
    expect(screen.getByText("Not Answered")).toBeInTheDocument();
  });

  it("shows Step 2 interest after Answered is clicked", async () => {
    renderModal();
    await userEvent.click(screen.getByLabelText(/Yes, I called/i));
    await userEvent.click(screen.getByText("Answered"));
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
  });

  it("shows Step 3 demo after marking interested", async () => {
    renderModal();
    await userEvent.click(screen.getByLabelText(/Yes, I called/i));
    await userEvent.click(screen.getByText("Answered"));
    await userEvent.click(screen.getByLabelText(/Yes, interested/i));
    expect(screen.getByText(/Step 3/i)).toBeInTheDocument();
  });
});

describe("LeadUpdateModal — form submission", () => {
  it("calls onClose when Cancel clicked", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls fetch with PATCH on submit", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, json: async () => ({ ...mockLead, status: "Picked Up" }),
    });
    const { onSaved } = renderModal();
    fireEvent.submit(screen.getByText("Save").closest("form")!);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      `/api/leads/${mockLead.id}`, expect.objectContaining({ method: "PATCH" })
    ));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("shows error when API fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, json: async () => ({ error: "Unauthorized" }),
    });
    renderModal();
    fireEvent.submit(screen.getByText("Save").closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized"));
  });
});
