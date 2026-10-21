"use client";

import React, { useState } from "react";
import type { Lead, LeadStatus, CallStatus, MeetingType } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface LeadUpdateModalProps {
  lead: Lead;
  onClose: () => void;
  onSaved: (updatedLead: Lead) => void;
}

interface FormState {
  // Step 1
  picked_up: boolean;
  call_status: CallStatus | null;
  // Step 2
  is_interested: boolean | null;
  // Step 3
  demo_website_sent: boolean;
  demo_liked: boolean | null;
  // Step 4
  meeting_scheduled: boolean;
  meeting_type: MeetingType | null;
  meeting_date_time: string | null;
  // Step 5
  site_visit_requested: boolean;
  // Notes
  notes: string;
  // Outcome
  status: LeadStatus;
}

const CALL_STATUSES: CallStatus[] = ["Answered", "Not Answered", "Busy", "Switched Off"];

export default function LeadUpdateModal({ lead, onClose, onSaved }: LeadUpdateModalProps) {
  const [form, setForm] = useState<FormState>({
    picked_up: lead.picked_up ?? false,
    call_status: lead.call_status ?? null,
    is_interested: lead.is_interested,
    demo_website_sent: lead.demo_website_sent,
    demo_liked: lead.demo_liked,
    meeting_scheduled: lead.meeting_scheduled,
    meeting_type: lead.meeting_type,
    meeting_date_time: lead.meeting_date_time,
    site_visit_requested: lead.site_visit_requested,
    notes: lead.notes,
    status: lead.status,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to save");
      return;
    }

    onSaved((await res.json()) as Lead);
  }

  // Derive status automatically from the flow — can be overridden in Step 5
  function autoStatus(): LeadStatus {
    if (form.meeting_scheduled) return "Meeting Scheduled";
    if (form.demo_website_sent) return "Demo Sent";
    if (form.is_interested === false) return "Dropped";
    if (form.is_interested === true) return "Interested";
    if (form.picked_up) return "Picked Up";
    return "New";
  }

  function handlePickedUp(val: boolean) {
    set("picked_up", val);
    if (!val) {
      set("call_status", null);
      set("is_interested", null);
      set("demo_website_sent", false);
      set("demo_liked", null);
      set("meeting_scheduled", false);
      set("meeting_type", null);
      set("meeting_date_time", null);
      set("status", "New");
    } else {
      set("status", "Picked Up");
    }
  }

  const step1Done = form.picked_up && form.call_status !== null;
  const step2Visible = step1Done && form.call_status === "Answered";
  const step3Visible = step2Visible && form.is_interested === true;
  const step4Visible = step3Visible;
  const step5Visible = step4Visible;

  const statusColors: Record<LeadStatus, string> = {
    New: "bg-gray-100 border-gray-300 text-gray-700",
    "Picked Up": "bg-blue-50 border-blue-300 text-blue-700",
    Interested: "bg-cyan-50 border-cyan-300 text-cyan-700",
    "Demo Sent": "bg-purple-50 border-purple-300 text-purple-700",
    "Meeting Scheduled": "bg-yellow-50 border-yellow-300 text-yellow-700",
    "Site Visit Requested": "bg-orange-50 border-orange-300 text-orange-700",
    Converted: "bg-green-50 border-green-400 text-green-700",
    Dropped: "bg-red-50 border-red-300 text-red-600",
  };

  return (
    <Modal isOpen title={lead.name || lead.company_name} onClose={onClose}>
      {/* Lead info header */}
      <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 space-y-0.5">
        {lead.phone && <p>📞 {lead.phone}</p>}
        {lead.category && <p>🏷️ {lead.category}{lead.area ? ` · ${lead.area}` : ""}</p>}
        {lead.address && <p>📍 {lead.address}</p>}
        {lead.map_link && (
          <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
             className="text-indigo-600 hover:underline inline-block">
            View on Google Maps ↗
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── STEP 1: Did you pick up / call? ── */}
        <fieldset className="rounded-lg border border-gray-200 p-4">
          <legend className="text-sm font-semibold text-gray-800 px-1">
            Step 1 — Did you call this lead?
          </legend>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="picked_up" checked={form.picked_up === true}
                onChange={() => handlePickedUp(true)}
                className="text-indigo-600 focus:ring-indigo-500" />
              Yes, I called
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="picked_up" checked={form.picked_up === false}
                onChange={() => handlePickedUp(false)}
                className="text-indigo-600 focus:ring-indigo-500" />
              Not yet
            </label>
          </div>

          {form.picked_up && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Call outcome:</p>
              <div className="flex flex-wrap gap-2">
                {CALL_STATUSES.map((cs) => (
                  <button key={cs} type="button"
                    onClick={() => {
                      set("call_status", cs);
                      if (cs !== "Answered") {
                        set("is_interested", null);
                        set("demo_website_sent", false);
                        set("demo_liked", null);
                        set("meeting_scheduled", false);
                        set("meeting_type", null);
                        set("meeting_date_time", null);
                        set("status", "Picked Up");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                      ${form.call_status === cs
                        ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-300"
                        : "bg-white border-gray-300 text-gray-600 hover:border-indigo-400"}`}
                    aria-pressed={form.call_status === cs}>
                    {cs}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* ── STEP 2: Interested? (only if call was answered) ── */}
        {step2Visible && (
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="text-sm font-semibold text-gray-800 px-1">
              Step 2 — Are they interested?
            </legend>
            <div className="flex gap-4">
              {[
                { label: "✅ Yes, interested", value: true },
                { label: "❌ Not interested", value: false },
              ].map(({ label, value }) => (
                <label key={String(value)} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="is_interested"
                    checked={form.is_interested === value}
                    onChange={() => {
                      set("is_interested", value);
                      set("status", value ? "Interested" : "Dropped");
                      if (!value) {
                        set("demo_website_sent", false);
                        set("demo_liked", null);
                        set("meeting_scheduled", false);
                        set("meeting_type", null);
                        set("meeting_date_time", null);
                      }
                    }}
                    className="text-indigo-600 focus:ring-indigo-500" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── STEP 3: Demo website? (only if interested) ── */}
        {step3Visible && (
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="text-sm font-semibold text-gray-800 px-1">
              Step 3 — Demo website
            </legend>
            <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
              <input type="checkbox" checked={form.demo_website_sent}
                onChange={(e) => {
                  set("demo_website_sent", e.target.checked);
                  if (e.target.checked) set("status", "Demo Sent");
                  else { set("demo_liked", null); set("status", "Interested"); }
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500" />
              Demo website sent to client
            </label>

            {form.demo_website_sent && (
              <div className="ml-5 space-y-2">
                <p className="text-xs font-medium text-gray-600">Client reaction:</p>
                <div className="flex gap-4">
                  {[
                    { label: "👍 Liked it", value: true },
                    { label: "👎 Didn't like it", value: false },
                    { label: "⏳ Not viewed yet", value: null },
                  ].map(({ label, value }) => (
                    <label key={String(value)} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="radio" name="demo_liked"
                        checked={form.demo_liked === value}
                        onChange={() => set("demo_liked", value)}
                        className="text-indigo-600 focus:ring-indigo-500" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        )}

        {/* ── STEP 4: Schedule meeting? ── */}
        {step4Visible && (
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="text-sm font-semibold text-gray-800 px-1">
              Step 4 — Schedule a meeting
            </legend>
            <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
              <input type="checkbox" checked={form.meeting_scheduled}
                onChange={(e) => {
                  set("meeting_scheduled", e.target.checked);
                  if (e.target.checked) set("status", "Meeting Scheduled");
                  else {
                    set("meeting_type", null);
                    set("meeting_date_time", null);
                    set("status", form.demo_website_sent ? "Demo Sent" : "Interested");
                  }
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500" />
              Meeting scheduled with client
            </label>

            {form.meeting_scheduled && (
              <div className="ml-5 space-y-3">
                {/* Meeting type */}
                <div className="flex gap-4">
                  {(["Google Meet", "Onsite"] as MeetingType[]).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="meeting_type" value={opt}
                        checked={form.meeting_type === opt}
                        onChange={() => set("meeting_type", opt)}
                        className="text-indigo-600 focus:ring-indigo-500" />
                      {opt === "Google Meet" ? "📹 Google Meet" : "🏢 Onsite Visit"}
                    </label>
                  ))}
                </div>

                {/* Date & time */}
                <div>
                  <label htmlFor="meeting_dt" className="block text-xs font-medium text-gray-600 mb-1">
                    Date &amp; time *
                  </label>
                  <input
                    id="meeting_dt"
                    type="datetime-local"
                    required={form.meeting_scheduled}
                    value={form.meeting_date_time ?? ""}
                    onChange={(e) => set("meeting_date_time", e.target.value || null)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </fieldset>
        )}

        {/* ── Notes ── */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">
            Notes / Remarks
          </label>
          <textarea
            id="notes" rows={3} value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Any remarks about this call or interaction…"
          />
        </div>

        {/* ── Outcome override ── */}
        <fieldset className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <legend className="text-sm font-semibold text-gray-700 px-1">Final Outcome</legend>
          <p className="text-xs text-gray-500 mb-3">
            Auto-set based on your inputs above. Override here if needed.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["New","Picked Up","Interested","Demo Sent","Meeting Scheduled","Converted","Dropped"] as LeadStatus[]).map((s) => (
              <button key={s} type="button"
                onClick={() => set("status", s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
                  ${statusColors[s]}
                  ${form.status === s ? "ring-2 ring-indigo-500 ring-offset-1 font-bold" : "opacity-60 hover:opacity-100"}`}
                aria-pressed={form.status === s}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
