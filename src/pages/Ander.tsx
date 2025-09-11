export default function AnderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <div className="max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">
          This section of the system has been restricted.
        </p>
        <p className="text-gray-500 italic">
          🚫 By executive directive, you are not authorized to view this content at this time.
        </p>
      </div>
    </div>
  );
}
