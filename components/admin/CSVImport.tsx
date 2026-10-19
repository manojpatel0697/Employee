"use client";

import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";

type UploadState = "idle" | "uploading" | "success" | "error";

interface CSVImportProps {
  secretKey: string;
}

export default function CSVImport({ secretKey }: CSVImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [insertedCount, setInsertedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState("uploading");
    setErrorMsg(null);
    setInsertedCount(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "x-admin-key": secretKey },
        body: formData,
      });

      const body = (await res.json()) as { inserted?: number; error?: string };

      if (!res.ok) {
        setState("error");
        setErrorMsg(body.error ?? "Import failed");
        return;
      }

      setInsertedCount(body.inserted ?? 0);
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      // Reset file input so the same file can be re-imported
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        id="csv-upload"
        onChange={handleFileChange}
      />
      <Button
        variant="primary"
        size="sm"
        disabled={state === "uploading"}
        onClick={() => inputRef.current?.click()}
      >
        {state === "uploading" ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Importing…
          </>
        ) : (
          "Import CSV"
        )}
      </Button>

      {state === "success" && insertedCount !== null && (
        <p className="text-sm text-green-700 font-medium">
          ✓ {insertedCount} lead{insertedCount !== 1 ? "s" : ""} imported
        </p>
      )}

      {state === "error" && errorMsg && (
        <p role="alert" className="text-sm text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
