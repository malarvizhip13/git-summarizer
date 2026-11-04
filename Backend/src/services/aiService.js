
const env = require("../config/env");
const { getOllamaClient } = require("../config/ollama");

const {
  buildRepositorySummaryPrompt,
} = require("../prompts/repositorySummaryPrompt");

const {
  analyzeRepositoryIntelligence,
} = require("../analyzers/repositoryIntelligence");

const DEFAULT_INSTRUCTIONS = `
You are GitSummarizer, an experienced software engineer
and code analysis assistant.

Provide accurate, structured and understandable technical explanations.
Do not invent project details that are not supported by the supplied input.
`;

const DEFAULT_OUTPUT_TOKENS = 1200;

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
    const error = new Error("Instructions must be a non-empty string.");
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
  const startedAt = Date.now();
  const promptCharacters = input.length;

  try {
    console.info("[AI] Inference started", {
      model: env.OLLAMA_MODEL,
      promptCharacters,
      maxOutputTokens,
    });

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

    const choice = response.choices?.[0];
    const outputText = choice?.message?.content?.trim();
    const finishReason = choice?.finish_reason || "unknown";
    const isComplete = finishReason === "stop";

    if (!outputText) {
      const error = new Error("Ollama returned an empty response.");
      error.statusCode = 502;
      throw error;
    }

    const durationMs = Date.now() - startedAt;

    console.info("[AI] Inference completed", {
      model: response.model || env.OLLAMA_MODEL,
      durationMs,
      promptCharacters,
      outputCharacters: outputText.length,
      finishReason,
      isComplete,
      usage: response.usage || null,
    });

    return {
      id: response.id || null,
      model: response.model || env.OLLAMA_MODEL,
      outputText,
      usage: response.usage || null,
      durationMs,
      finishReason,
      isComplete,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.error("[AI] Inference failed", {
      model: env.OLLAMA_MODEL,
      durationMs,
      promptCharacters,
      maxOutputTokens,
      message: error.message,
    });

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
  // Build additional repository intelligence from retrieved source files.
  const intelligence = analyzeRepositoryIntelligence({
    files,
    analysis,
  });

  // Preserve existing static analysis and add intelligence.
  const enrichedAnalysis = {
    ...(analysis || {}),
    intelligence,
  };

  const prompt = buildRepositorySummaryPrompt({
    repository,
    source,
    retrieval,
    analysis: enrichedAnalysis,
    files,
  });

  const result = await generateText({
    input: prompt.input,
    instructions: prompt.instructions,
    maxOutputTokens: DEFAULT_OUTPUT_TOKENS,
  });

  return {
    model: result.model,
    summary: result.outputText,
    usage: result.usage,
    durationMs: result.durationMs,
    finishReason: result.finishReason,
    isComplete: result.isComplete,
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
