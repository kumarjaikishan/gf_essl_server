const axios = require('axios');

/**
 * Forwards the exact raw request sent by the ESSL machine to the remote server.
 * Uses axios with raw text payload and matching headers/query.
 * Runs asynchronously so this server immediately responds to the machine as before.
 */

const FORWARD_BASE_URL = (process.env.FORWARD_ESSL_URL || "http://goodfeelsd.com/essl").replace(/\/+$/, "");

async function forwardEsslRequest(req) {
  if (!FORWARD_BASE_URL) return;

  try {
    let subPath = req.originalUrl || req.url;

    // Avoid duplicate /essl/essl in case incoming path already has /essl
    if (subPath.startsWith("/essl")) {
      subPath = subPath.replace(/^\/essl/, "");
    }
    if (!subPath.startsWith("/")) {
      subPath = "/" + subPath;
    }

    const targetUrl = `${FORWARD_BASE_URL}${subPath}`;

    // Extract headers to preserve
    const headers = {};
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }
    if (req.headers['user-agent']) {
      headers['user-agent'] = req.headers['user-agent'];
    }

    // Determine payload: exactly the raw body sent by the machine
    const data = (typeof req.bodyRaw === 'string' && req.bodyRaw.length > 0)
      ? req.bodyRaw
      : req.body;

    console.log(`⏩ [AXIOS FORWARD] Sending ${req.method} to ${targetUrl}`);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: data,
      headers: headers,
      timeout: 10000,
      validateStatus: () => true // Allow any status without throwing
    });

    console.log(`✅ [AXIOS FORWARD SUCCESS] Remote returned status: ${response.status}`);
  } catch (error) {
    console.error(`❌ [AXIOS FORWARD ERROR]:`, error.message);
  }
}

module.exports = { forwardEsslRequest };
