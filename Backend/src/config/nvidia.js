
const OpenAI = require("openai");
const env = require("./env");

let nvidiaClient = null;

/**
 * Initialize and return the NVIDIA NIM client.
 *
 * Client initialization is lazy:
 * the client is created only when first requested.
 */
const getNvidiaClient = () => {
  if (!env.NVIDIA_API_KEY) {
    const error = new Error(
      "NVIDIA API key is not configured."
    );

    error.statusCode = 503;
    throw error;
  }

  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: env.NVIDIA_API_KEY,
      baseURL: env.NVIDIA_BASE_URL,
      timeout: 120000,
      maxRetries: 2,
    });
  }

  return nvidiaClient;
};

module.exports = {
  getNvidiaClient,
};
