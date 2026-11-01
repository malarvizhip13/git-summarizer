
const env = require("../config/env");
const { getOllamaClient } = require("../config/ollama");

const {
  buildRepositorySummaryPrompt,
} = require("../prompts/repositorySummaryPrompt");

const DEFAULT_INSTRUCTIONS = `
You are GitSummarizer, an experienced software engineer
and code analysis assistant.

Provide accurate, structured and understandable technical explanations.
Do not invent project details that are not supported by the supplied input.
`;

/**
 * Generate text using the local Ollama model.
 */
const generateText = async ({
  input,
  instructions = DEFAULT_INSTRUCTIONS,
  maxOutputTokens = 500,
} = {}) => {
  if (typeof input !== "string" || !input.trim()) {
    const error = new Error("A non-empty input is required.");
    error.statusCode = 400;
    throw error;
  }

  if (
    typeof instructions !== "string" ||
    !instructions.trim()
  ) {
    const error = new Error(
      "Instructions must be a non-empty string."
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    maxOutputTokens > 4000
  ) {
    const error = new Error(
      "maxOutputTokens must be an integer between 1 and 4000."
    );
    error.statusCode = 400;
    throw error;
  }

  const client = getOllamaClient();

  try {
    const response = await client.chat.completions.create({
      model: env.OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: instructions,
        },
        {
          role: "user",
          content: input.trim(),
        },
      ],
      max_tokens: maxOutputTokens,
      temperature: 0.2,
      stream: false,
    });

    const outputText =
      response.choices?.[0]?.message?.content?.trim();

    if (!outputText) {
      const error = new Error(
        "Ollama returned an empty response."
      );
      error.statusCode = 502;
      throw error;
    }

    return {
      id: response.id || null,
      model: response.model || env.OLLAMA_MODEL,
      outputText,
      usage: response.usage || null,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const wrappedError = new Error(
      `Local AI request failed: ${error.message}`
    );

    wrappedError.statusCode = 502;
    wrappedError.cause = error;

    throw wrappedError;
  }
};

/**
 * Generate an AI-powered GitHub repository summary.
 */
const generateRepositorySummary = async ({
  repository,
  source,
  retrieval,
  analysis,
  files,
} = {}) => {
  const prompt = buildRepositorySummaryPrompt({
    repository,
    source,
    retrieval,
    analysis,
    files,
  });

  const result = await generateText({
    input: prompt.input,
    instructions: prompt.instructions,
    maxOutputTokens: 1500,
  });

  return {
    model: result.model,
    summary: result.outputText,
    usage: result.usage,
    coverage: {
      includedFiles: prompt.includedFiles,
      omittedFiles: prompt.omittedFiles,
      sourceCharacters: prompt.sourceCharacters,
    },
  };
};

module.exports = {
  generateText,
  generateRepositorySummary,
};
