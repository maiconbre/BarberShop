import React, { useState, useEffect } from 'react';

interface TestResult {
  status?: number;
  ok?: boolean;
  data?: unknown;
  error?: string;
}

interface TestResults {
  health?: TestResult;
  services?: TestResult;
  barbershops?: TestResult;
}

const DirectApiTest: React.FC = () => {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(false);

  const testDirectApi = async () => {
    setLoading(true);
    const testResults: TestResults = {};

    // Test 1: Health check
    try {
      const response = await fetch('http://localhost:6543/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      testResults.health = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      testResults.health = {
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 2: Services endpoint
    try {
      const response = await fetch('http://localhost:6543/api/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      testResults.services = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      testResults.services = {
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: Barbershops endpoint
    try {
      const response = await fetch('http://localhost:6543/api/barbershops', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      testResults.barbershops = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      };
    } catch (error) {
      testResults.barbershops = {
        error: error instanceof Error ? error.message : String(error)
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    // Auto-test on mount
    testDirectApi();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-red-900/90 text-white p-4 rounded-lg max-w-lg z-50 text-xs">
      <h3 className="font-bold mb-2 text-red-400">🚨 Direct API Test</h3>
      
      <button 
        onClick={testDirectApi}
        disabled={loading}
        className="mb-2 px-2 py-1 bg-red-600 rounded text-xs disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Again'}
      </button>

      {Object.keys(results).length > 0 && (
        <div className="space-y-2">
          {Object.entries(results).map(([endpoint, result]: [string, TestResult]) => (
            <div key={endpoint} className="border border-red-700 p-2 rounded">
              <div className="font-bold text-red-300">{endpoint.toUpperCase()}</div>
              {result.error ? (
                <div className="text-red-400">❌ {result.error}</div>
              ) : (
                <div>
                  <div className={`${result.ok ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {result.status} {result.ok ? '✅' : '❌'}
                  </div>
                  {result.data && (
                    <pre className="text-xs mt-1 overflow-auto max-h-32">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectApiTest;