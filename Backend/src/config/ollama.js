const OpenAI = require("openai");
const env = require("./env");

let ollamaClient = null;

const getOllamaClient = () => {
  if (!ollamaClient) {
    if (!env.OLLAMA_BASE_URL || !env.OLLAMA_MODEL) {
      const error = new Error(
        "Ollama configuration is missing."
      );

      error.statusCode = 503;
      throw error;
    }

    ollamaClient = new OpenAI({
      baseURL: env.OLLAMA_BASE_URL,
      apiKey: "ollama",
      timeout: env.OLLAMA_TIMEOUT,
      maxRetries: 1,
    });
  }

  return ollamaClient;
};

module.exports = {
  getOllamaClient,
};