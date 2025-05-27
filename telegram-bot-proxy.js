// HTML template for documentation
const DOC_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Telegram Bot API Proxy Documentation</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #0088cc; }
        .code {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            overflow-x: auto;
        }
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .example {
            background: #e7f5ff;
            border-left: 4px solid #0088cc;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Telegram Bot API Proxy</h1>
    <p>This service acts as a transparent proxy for the Telegram Bot API. It allows you to bypass network restrictions and create middleware for your Telegram bot applications.</p>
    
    <h2>How to Use</h2>
    <p>Replace <code>api.telegram.org</code> with this worker's URL in your API calls.</p>
    
    <div class="example">
        <h3>Example Usage:</h3>
        <p>Original Telegram API URL:</p>
        <div class="code">https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage</div>
        <p>Using this proxy:</p>
        <div class="code">https://{YOUR_WORKER_URL}/bot{YOUR_BOT_TOKEN}/sendMessage</div>
    </div>

    <h2>Features</h2>
    <ul>
        <li>Supports all Telegram Bot API methods</li>
        <li>Handles both GET and POST requests</li>
        <li>Full CORS support for browser-based applications</li>
        <li>Transparent proxying of responses</li>
        <li>Maintains original status codes and headers</li>
    </ul>

    <div class="note">
        <strong>Note:</strong> This proxy does not store or modify your bot tokens. All requests are forwarded directly to Telegram's API servers.
    </div>

    <h2>Example Code</h2>
    <div class="code">
// JavaScript Example
fetch('https://{YOUR_WORKER_URL}/bot{YOUR_BOT_TOKEN}/sendMessage', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        chat_id: "123456789",
        text: "Hello from Telegram Bot API Proxy!"
    })
})
.then(response => response.json())
.then(data => console.log(data));
    </div>
</body>
</html>`;

// Handle main request
async function handleRequest(request) {
  const url = new URL(request.url);

  // Serve documentation at root
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(DOC_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
      }
    });
  }

  // Replace domain
  const proxyUrl = request.url.replace(url.hostname, 'api.telegram.org');

  // Rebuild request
  const newRequest = new Request(proxyUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(newRequest);

    // Add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

    const responseBody = await response.arrayBuffer();
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(`Error: ${err.message || err.toString()}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Handle CORS preflight
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Worker entry point
addEventListener('fetch', event => {
  const req = event.request;
  if (req.method === 'OPTIONS') {
    event.respondWith(handleOptions());
  } else {
    event.respondWith(handleRequest(req));
  }
});
