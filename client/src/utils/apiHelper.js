/**
 * Safe Response Parser Utility for API fetch requests
 * Prevents "Unexpected token 'A', 'An error o'... is not valid JSON" syntax errors
 * when backend returns HTML error pages or 502/504 gateways.
 */
export async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (err) {
      throw new Error('Failed to parse backend JSON response.');
    }
  }

  // Handle non-JSON HTML or text error responses (Render / Vercel error pages)
  const textContent = await response.text();
  console.error('Non-JSON Backend Response:', textContent);

  if (!response.ok) {
    throw new Error('Backend service unreachable or CORS restricted. Please verify API URL.');
  }

  throw new Error('Unexpected non-JSON response from server.');
}
