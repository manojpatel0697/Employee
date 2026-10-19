import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800">Page not found</h2>
      <p className="text-gray-500">
        The page you are looking for does not exist or you do not have access.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
