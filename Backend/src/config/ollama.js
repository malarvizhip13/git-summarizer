const OpenAI = require("openai");
const { Agent, fetch } = require("undici");
const env = require("./env");

let ollamaClient = null;

const ollamaDispatcher = new Agent({
  headersTimeout: 660000,
  bodyTimeout: 660000,
  connectTimeout: 30000,
});

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
      timeout: 660000,
      maxRetries: 0,

      // Use fetch from the same Undici package as Agent.
      fetch,

      fetchOptions: {
        dispatcher: ollamaDispatcher,
      },
    });
  }

  return ollamaClient;
};

module.exports = {
  getOllamaClient,
};