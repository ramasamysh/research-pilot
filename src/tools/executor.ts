import { tavilyClient } from "../clients.js";

// export type ToolExecutionResult = {
//   ok: boolean;
//   data?: unknown;
//   error?: string;
// };

type ToolInput = Record<string, unknown>;

function getString(
  input: ToolInput,
  key: string,
  defaultValue?: string,
): string {
  const value = input[key];

  if (typeof value === "string") {
    return value;
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error(`Expected '${key}' to be a string`);
}

function getNumber(
  input: ToolInput,
  key: string,
  defaultValue: number,
): number {
  const value = input[key];

  if (typeof value === "number") {
    return value;
  }

  return defaultValue;
}

function getStringArray(input: ToolInput, key: string): string[] {
  const value = input[key];

  if (!Array.isArray(value)) {
    throw new Error(`Expected '${key}' to be an array`);
  }

  if (!value.every((item) => typeof item === "string")) {
    throw new Error(`Every item in '${key}' must be a string`);
  }

  return value;
}

async function runWebSearch(input: ToolInput) {
  const query = getString(input, "query");

  const requestedMaxResults = getNumber(input, "max_results", 6);

  const maxResults = Math.min(
    Math.max(requestedMaxResults, 1),
    10,
  );

  const searchDepthValue = getString(
    input,
    "search_depth",
    "advanced",
  );

  const searchDepth =
    searchDepthValue === "basic"
      ? "basic"
      : "advanced";

  const topicValue = getString(
    input,
    "topic",
    "general",
  );

  const topic =
    topicValue === "news"
      ? "news"
      : "general";

  const response = await tavilyClient.search(query, {
    searchDepth,
    maxResults,
    topic,

    // We want Claude to synthesize the answer itself.
    includeAnswer: false,

    // Search should discover sources.
    // Full content comes through extract_pages.
    includeRawContent: false,
  });

  return {
    query,

    results: response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    })),
  };
}

async function runExtractPages(input: ToolInput) {
  const urls = getStringArray(input, "urls");

  if (urls.length > 5) {
    throw new Error(
      "ResearchPilot allows at most 5 URLs per extraction call",
    );
  }

  const extractDepthValue = getString(
    input,
    "extract_depth",
    "basic",
  );

  const extractDepth =
    extractDepthValue === "advanced"
      ? "advanced"
      : "basic";

  const response = await tavilyClient.extract(urls, {
    extractDepth,
  });

  return {
    pages: response.results.map((result) => ({
      url: result.url,

      // Avoid dumping enormous web pages into Claude's context.
      content: (result.rawContent ?? "").slice(0, 12_000),
    })),

    failedUrls: response.failedResults ?? [],
  };
}

export async function executeTool(
  name: string,
  input: unknown,
): Promise<string> {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new Error("Tool input must be an object");
  }

  const typedInput = input as ToolInput;

  let result: unknown;

  switch (name) {
    case "web_search":
      result = await runWebSearch(typedInput);
      break;

    case "extract_pages":
      result = await runExtractPages(typedInput);
      break;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return JSON.stringify(result);
}