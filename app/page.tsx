import Link from "next/link";

const portals = [
  {
    href: "/admin/enter-key",
    label: "Admin Panel",
    description: "Manage leads, employees, and PRD projects.",
    color: "bg-indigo-600 hover:bg-indigo-700",
  },
  {
    href: "/employee/login",
    label: "Employee Portal",
    description: "View and update your assigned leads.",
    color: "bg-teal-600 hover:bg-teal-700",
  },
  {
    href: "/developer",
    label: "Developer / PRD Status",
    description: "Track project PRDs and development milestones.",
    color: "bg-violet-600 hover:bg-violet-700",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Agency Portal</h1>
        <p className="mt-2 text-gray-500">Choose your portal to get started.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-3xl">
        {portals.map(({ href, label, description, color }) => (
          <Link
            key={href}
            href={href}
            className={`${color} text-white rounded-2xl p-6 shadow-md transition-colors`}
          >
            <h2 className="text-xl font-semibold">{label}</h2>
            <p className="mt-1 text-sm opacity-90">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
