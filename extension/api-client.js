/* Shared JSON-RPC client: same base URL, api-key, and safe JSON parsing (HTML error pages). */
const API_BASE_URL = 'https://api-backoffice.dgos.id/jsonrpc';
const API_KEY = '4ff1bf4a0583d1738e1c68eed5002ceb77c10037';

function jsonRpcRequestHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': API_KEY
  };
}

/**
 * fetch() often gets HTML (403/502/proxy) when the API key is missing or the network blocks the call.
 * response.json() then throws "Unexpected token '<'".
 */
function parseJsonRpcResponse(response) {
  return response.text().then(text => {
    const trimmed = text.trimStart();
    if (trimmed.startsWith('<')) {
      throw new Error(
        'Server returned HTML instead of JSON (HTTP ' + response.status +
        '). Check api-key, VPN/firewall, or API availability.'
      );
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid response (HTTP ' + response.status + '): ' + text.slice(0, 100));
    }
  });
}
