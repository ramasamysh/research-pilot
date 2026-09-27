import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";

import { config } from "./config.js";

// reasoning: The `Anthropic` and `tavily` clients are initialized with the API keys from the configuration. The `Anthropic` client is created using the `Anthropic` class from the `@anthropic-ai/sdk` package, while the `tavily` client is created using the `tavily` function from the `@tavily/core` package. Both clients are exported for use in other parts of the application.
export const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey
});

export const tavilyClient = tavily({
  apiKey: config.tavilyApiKey,
});
