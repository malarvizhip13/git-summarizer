
const Anthropic = require("@anthropic-ai/sdk");
const env = require("./env");

let claudeClient = null;

const getClaudeClient = () => {
  if (!env.ANTHROPIC_API_KEY) {
    const error = new Error(
      "Anthropic API key is not configured."
    );
    error.statusCode = 503;
    throw error;
  }

  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  return claudeClient;
};

module.exports = {
  getClaudeClient,
};
