import { HashWidget } from "./widgets/hash-widget/hash-widget";

/**
 * SHA256 Hash Computation Page
 *
 * This page uses the HashWidget component, which is a fully self-contained,
 * reusable component with its own isolated state and Web Worker.
 */
export default function HashComputationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            SHA256 File Hasher
          </h1>
          <p className="text-lg text-gray-600">
            Calculate SHA256 hash for files up to 10GB
          </p>
        </div>

        {/* Hash Widget */}
        <HashWidget />
      </div>
    </div>
  );
}
