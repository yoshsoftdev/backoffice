importScripts('api-client.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'dgosJsonRpc' || typeof request.body !== 'string') {
    return;
  }
  fetch(API_BASE_URL, {
    method: 'POST',
    headers: jsonRpcRequestHeaders(),
    body: request.body,
    credentials: 'omit'
  })
    .then(parseJsonRpcResponse)
    .then(data => sendResponse({ ok: true, data }))
    .catch(err => {
      sendResponse({ ok: false, error: err.message || String(err) });
    });
  return true;
});
