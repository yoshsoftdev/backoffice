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

/**
 * Run JSON-RPC from the extension service worker when possible so the request is not tied to
 * the LinkedIn page origin (avoids many HTTP 403 HTML responses from API/WAF on Windows).
 */
function jsonRpcCall(bodyObject) {
  const body = JSON.stringify(bodyObject);
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage({ type: 'dgosJsonRpc', body }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error('Empty response from extension background'));
          return;
        }
        if (response.ok) resolve(response.data);
        else reject(new Error(response.error || 'API request failed'));
      });
      return;
    }
    fetch(API_BASE_URL, {
      method: 'POST',
      headers: jsonRpcRequestHeaders(),
      body,
      credentials: 'omit'
    })
      .then(parseJsonRpcResponse)
      .then(resolve)
      .catch(reject);
  });
}
