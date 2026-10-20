import Link from "next/link";
import TheramifyLogo from "@/components/ui/TheramifyLogo";

const portals = [
  {
    href: "/admin/login",
    label: "Admin Panel",
    description: "Manage leads, employees, and PRD projects.",
    color: "bg-indigo-600 hover:bg-indigo-700",
    icon: "🔐",
  },
  {
    href: "/employee/login",
    label: "Employee Portal",
    description: "View and update your assigned leads.",
    color: "bg-teal-600 hover:bg-teal-700",
    icon: "👤",
  },
  {
    href: "/developer/login",
    label: "Developer / PRD Status",
    description: "Track project PRDs and development milestones.",
    color: "bg-violet-600 hover:bg-violet-700",
    icon: "💻",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 bg-gray-950">
      {/* Company logo + name */}
      <div className="flex flex-col items-center gap-4">
        <TheramifyLogo size={120} />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Theramify Technologies
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            Agency Operations, Lead Pipeline &amp; PRD Status Portal
          </p>
        </div>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 w-full max-w-3xl">
        {portals.map(({ href, label, description, color, icon }) => (
          <Link
            key={href}
            href={href}
            className={`${color} text-white rounded-2xl p-6 shadow-lg transition-colors`}
          >
            <span className="text-2xl mb-2 block" aria-hidden="true">
              {icon}
            </span>
            <h2 className="text-lg font-semibold">{label}</h2>
            <p className="mt-1 text-sm opacity-85">{description}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        &copy; {new Date().getFullYear()} Theramify Technologies. All rights reserved.
      </p>
    </main>
  );
}
