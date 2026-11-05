
const env = require("../config/env");

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

const DEFAULT_OUTPUT_TOKENS = 4000;

/**
 * Generate text using NVIDIA NIM.
 */
const generateText = async ({
  input,
  instructions = DEFAULT_INSTRUCTIONS,
  maxOutputTokens = DEFAULT_OUTPUT_TOKENS,
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

  if (!env.NVIDIA_API_KEY) {
    const error = new Error(
      "NVIDIA API key is not configured."
    );
    error.statusCode = 503;
    throw error;
  }

  const startedAt = Date.now();
  const promptCharacters = input.length;

  try {
    console.info("[AI] Inference started", {
      provider: "nvidia",
      model: env.NVIDIA_MODEL,
      promptCharacters,
      maxOutputTokens,
      thinkingEnabled: false,
    });

    const response = await fetch(
      `${env.NVIDIA_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.NVIDIA_MODEL,
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
          temperature: env.NVIDIA_TEMPERATURE,
          max_tokens: maxOutputTokens,
          stream: false,

          // NVIDIA-specific parameter
          chat_template_kwargs: {
            enable_thinking: false,
          },
        }),
        signal: AbortSignal.timeout(120000),
      }
    );

    if (!response.ok) {
      const responseBody = await response.text();

      const error = new Error(
        `NVIDIA API returned HTTP ${response.status}: ${responseBody}`
      );

      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();

    const choice = data.choices?.[0];

    const outputText =
      typeof choice?.message?.content === "string"
        ? choice.message.content.trim()
        : "";

    const finishReason = choice?.finish_reason || "unknown";

    const isComplete = finishReason === "stop";

    if (!outputText) {
      const error = new Error(
        "NVIDIA returned an empty response. " +
        `Finish reason: ${finishReason}`
      );

      error.statusCode = 502;
      throw error;
    }

    const durationMs = Date.now() - startedAt;

    const usage = data.usage
      ? {
          input_tokens: data.usage.prompt_tokens ?? null,
          output_tokens: data.usage.completion_tokens ?? null,
          total_tokens: data.usage.total_tokens ?? null,
        }
      : null;

    console.info("[AI] Inference completed", {
      provider: "nvidia",
      model: data.model || env.NVIDIA_MODEL,
      durationMs,
      promptCharacters,
      outputCharacters: outputText.length,
      finishReason,
      isComplete,
      usage,
    });

    return {
      id: data.id || null,
      model: data.model || env.NVIDIA_MODEL,
      outputText,
      usage,
      durationMs,
      finishReason,
      isComplete,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.error("[AI] Inference failed", {
      provider: "nvidia",
      model: env.NVIDIA_MODEL,
      durationMs,
      promptCharacters,
      maxOutputTokens,
      message: error.message,
    });

    if (error.statusCode) {
      throw error;
    }

    const wrappedError = new Error(
      `NVIDIA API request failed: ${error.message}`
    );

    wrappedError.statusCode =
      error.name === "TimeoutError" ? 504 : 502;

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
  const intelligence = analyzeRepositoryIntelligence({
    files,
    analysis,
  });

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
