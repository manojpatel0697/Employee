"use client";

import React, { useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import Button from "@/components/ui/Button";

type UploadState = "idle" | "uploading" | "success" | "error";

interface XLSXImportProps {
  employees: Profile[];
  secretKey: string;
  onImported?: (count: number) => void;
}

export default function XLSXImport({ employees, secretKey, onImported }: XLSXImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [insertedCount, setInsertedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState<string>("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("uploading");
    setErrorMsg(null);
    setInsertedCount(null);

    const formData = new FormData();
    formData.append("file", file);
    if (assignTo) formData.append("assignTo", assignTo);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "x-admin-key": secretKey },
        body: formData,
      });

      const body = (await res.json()) as {
        inserted?: number;
        error?: string;
        details?: string;
      };

      if (!res.ok) {
        setState("error");
        setErrorMsg(body.error ?? "Import failed");
        return;
      }

      setInsertedCount(body.inserted ?? 0);
      setState("success");
      onImported?.(body.inserted ?? 0);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Import Leads</h3>
        <p className="text-xs text-gray-500">
          Upload an Excel (.xlsx) or CSV file. Columns: Sl No, Name, Phone, Category,
          Search Category, Area, Address, Map Link.
          Up to 5,000 rows per file.
        </p>
      </div>

      {/* Optional: assign all imported leads to an employee immediately */}
      <div>
        <label htmlFor="import-assign" className="block text-xs font-medium text-gray-700 mb-1">
          Assign all imported leads to (optional)
        </label>
        <select
          id="import-assign"
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Leave unassigned —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          id="xlsx-upload"
          onChange={handleFileChange}
        />
        <Button
          variant="primary"
          size="sm"
          disabled={state === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {state === "uploading" ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Importing…
            </span>
          ) : (
            "📂 Import Excel / CSV"
          )}
        </Button>

        {state === "success" && insertedCount !== null && (
          <p className="text-sm text-green-700 font-medium">
            ✓ {insertedCount.toLocaleString()} lead{insertedCount !== 1 ? "s" : ""} imported
            {assignTo
              ? ` and assigned to ${employees.find((e) => e.id === assignTo)?.full_name ?? "employee"}`
              : ""}
          </p>
        )}

        {state === "error" && errorMsg && (
          <p role="alert" className="text-sm text-red-600">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
