import HashComputationPage from "@/features/hash-computation/hash-computation.page";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SHA256 File Hasher
          </h1>
          <p className="text-lg text-gray-600">
            Calculate SHA256 hash for files up to 10GB
          </p>
        </div>
        
        <HashComputationPage />
      </div>
    </div>
  );
}

export default App;

