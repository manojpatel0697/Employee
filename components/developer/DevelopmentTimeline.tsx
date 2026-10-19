import React from "react";
import type { DevelopmentStatusEnum } from "@/lib/types";

const STAGES: DevelopmentStatusEnum[] = [
  "Not Started",
  "Frontend Built",
  "Backend & DB Hooked",
  "Deployed",
  "Live",
];

interface DevelopmentTimelineProps {
  currentStatus: DevelopmentStatusEnum;
}

export default function DevelopmentTimeline({
  currentStatus,
}: DevelopmentTimelineProps) {
  const currentIndex = STAGES.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-0">
      {STAGES.map((stage, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;
        const isLast = idx === STAGES.length - 1;

        return (
          <div key={stage} className="flex items-start gap-3">
            {/* Circle + connector column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  isPast
                    ? "border-green-500 bg-green-500"
                    : isCurrent
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isPast ? (
                  /* Check mark SVG */
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isCurrent ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </div>

              {/* Vertical connector line (not after the last item) */}
              {!isLast && (
                <div
                  className={`mt-0.5 h-6 w-0.5 ${
                    isPast ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Stage label */}
            <p
              className={`pb-2 text-sm leading-6 ${
                isPast
                  ? "font-medium text-green-700"
                  : isCurrent
                  ? "font-bold text-indigo-700"
                  : isFuture
                  ? "text-gray-400"
                  : ""
              }`}
            >
              {stage}
            </p>
          </div>
        );
      })}
    </div>
  );
}
