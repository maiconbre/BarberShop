import React, { useState } from 'react';
import { CURRENT_ENV } from '../../config/environmentConfig';

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

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [testing, setTesting] = useState(false);

  const testApi = async () => {
    setTesting(true);
    const results: TestResults = {};

    try {
      // Test 1: Health check
      const healthResponse = await fetch(`${CURRENT_ENV.apiUrl}/`);
      results.health = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: await healthResponse.json()
      };
    } catch (error) {
      results.health = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test 2: Services endpoint (public)
      const servicesResponse = await fetch(`${CURRENT_ENV.apiUrl}/api/services`);
      results.services = {
        status: servicesResponse.status,
        ok: servicesResponse.ok,
        data: await servicesResponse.json()
      };
    } catch (error) {
      results.services = { error: error instanceof Error ? error.message : String(error) };
    }

    try {
      // Test 3: Barbershops endpoint
      const barbershopsResponse = await fetch(`${CURRENT_ENV.apiUrl}/api/barbershops/check-slug/test`);
      results.barbershops = {
        status: barbershopsResponse.status,
        ok: barbershopsResponse.ok,
        data: await barbershopsResponse.json()
      };
    } catch (error) {
      results.barbershops = { error: error instanceof Error ? error.message : String(error) };
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 text-xs">
      <h3 className="font-bold mb-2 text-green-400">🔧 API Test</h3>
      <div className="mb-2">
        <strong>API URL:</strong> {CURRENT_ENV.apiUrl}
      </div>
      <button 
        onClick={testApi}
        disabled={testing}
        className="mb-2 px-2 py-1 bg-green-600 rounded text-xs disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test API'}
      </button>
      {Object.keys(testResults).length > 0 && (
        <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ApiTest;