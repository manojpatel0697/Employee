import React from "react";
import type { ProjectPRD, LovableGenerationStatus } from "@/lib/types";
import Card from "@/components/ui/Card";
import DevelopmentTimeline from "./DevelopmentTimeline";

const LOVABLE_STEPS: LovableGenerationStatus[] = [
  "Pending Email Intake",
  "Generated via Lovable",
  "In Development",
  "Review",
  "Completed",
];

interface PRDStatusCardProps {
  project: ProjectPRD & { developer_name?: string };
}

export default function PRDStatusCard({ project }: PRDStatusCardProps) {
  const currentLovableIndex = LOVABLE_STEPS.indexOf(
    project.lovable_generation_status
  );

  // Truncate PRD content to 200 chars
  const snippet =
    (project.prd_content?.substring(0, 200) ?? "") +
    ((project.prd_content?.length ?? 0) > 200 ? "..." : "");

  return (
    <Card className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{project.client_name}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{project.client_email}</p>
      </div>

      {/* PRD snippet */}
      {snippet && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
          {snippet}
        </p>
      )}

      {/* Lovable generation stepper */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Lovable Generation Status
        </h3>
        <ol className="flex flex-wrap gap-y-2">
          {LOVABLE_STEPS.map((step, idx) => {
            const isPast = idx < currentLovableIndex;
            const isCurrent = idx === currentLovableIndex;
            const isFuture = idx > currentLovableIndex;
            const isLast = idx === LOVABLE_STEPS.length - 1;

            return (
              <li key={step} className="flex items-center">
                {/* Step bubble */}
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isPast
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isPast ? (
                    <svg
                      className="h-3.5 w-3.5"
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
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`mx-1.5 text-xs ${
                    isPast
                      ? "text-green-700 font-medium"
                      : isCurrent
                      ? "text-indigo-700 font-bold"
                      : isFuture
                      ? "text-gray-400"
                      : ""
                  }`}
                >
                  {step}
                </span>

                {/* Arrow connector */}
                {!isLast && (
                  <span className="mr-1.5 text-gray-300" aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Development timeline */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Development Progress
        </h3>
        <DevelopmentTimeline currentStatus={project.development_status} />
      </div>

      {/* Blocker warning */}
      {project.current_blocker && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span className="font-semibold">Blocker: </span>
          {project.current_blocker}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
        {project.developer_name ? (
          <span>
            Assigned developer:{" "}
            <span className="font-medium text-gray-700">
              {project.developer_name}
            </span>
          </span>
        ) : (
          <span className="italic">No developer assigned</span>
        )}
      </div>
    </Card>
  );
}
