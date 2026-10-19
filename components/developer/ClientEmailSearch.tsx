"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientEmailSearchProps {
  defaultValue?: string;
}

export default function ClientEmailSearch({
  defaultValue = "",
}: ClientEmailSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/developer?clientEmail=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/developer");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by client email…"
        aria-label="Search by client email"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        Search
      </button>
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push("/developer");
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  );
}
