
# ResearchPilot

ResearchPilot is a command-line technical research assistant built with TypeScript. It uses Anthropic tool calling to search the web with Tavily, retrieve selected pages, and synthesize a response to a research question.

This project is also a learning exercise: compare its architecture and research workflow with [VS Code's web search extension](https://github.com/microsoft/vscode-websearchforcopilot) to understand the design choices and capabilities needed for a production-ready web research tool.

## Capabilities

- Interactive terminal session for asking multiple research questions.
- Web search through Tavily, with basic or advanced depth and general or news topics.
- Page extraction for up to five URLs at a time, with extracted content capped before it is sent to the model.
- Anthropic tool-use loop that returns search and extraction results to the model for synthesis.
- Configurable model, output token limit, and total tool-call budget.

## Requirements

- Node.js with npm.
- An Anthropic API key.
- A Tavily API key.

## Getting Started

Install dependencies:

```sh
npm install
```

Create a `.env` file in the project root:

```dotenv
ANTHROPIC_API_KEY=your-anthropic-api-key
TAVILY_API_KEY=your-tavily-api-key

# Optional
CLAUDE_MODEL=claude-sonnet-5
MAX_TOOL_CALLS=10
MAX_OUTPUT_TOKENS=6000
```

Start the interactive development session:

```sh
npm run dev
```

Enter a research question at the prompt. Enter `exit` to quit.

To compile and run the built application:

```sh
npm run build
npm start
```

## How It Works

1. `src/index.ts` reads research questions from the terminal.
2. `src/agent.ts` sends the conversation and available tool definitions to Anthropic, then continues the tool-use loop until the model returns a final response or the tool budget is reached.
3. `src/tools/definitions.ts` declares the `web_search` and `extract_pages` tools.
4. `src/tools/executor.ts` runs those tools through Tavily and returns the results to the agent.
5. `src/config.ts` loads API keys and runtime options from environment variables.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | None | API key used by the Anthropic SDK. |
| `TAVILY_API_KEY` | Yes | None | API key used by Tavily search and extraction. |
| `CLAUDE_MODEL` | No | `claude-sonnet-5` | Anthropic model identifier. |
| `MAX_TOOL_CALLS` | No | `10` | Maximum number of tool calls per research question. |
| `MAX_OUTPUT_TOKENS` | No | `6000` | Maximum output tokens requested from the model per response. |

## Project Layout

```text
src/
	agent.ts              Anthropic tool-use loop and final response handling
	clients.ts            Anthropic and Tavily clients
	config.ts             Environment configuration
	index.ts              Interactive command-line entry point
	prompts.ts            Agent prompt definitions
	tools/
		definitions.ts      Tool schemas exposed to the model
		executor.ts         Tavily search and page extraction
docs/
	design/               Architecture and workflow diagrams
	generated-results/    Generated research and harness notes
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the CLI directly from TypeScript with `tsx`. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled CLI from `dist/index.js`. |
| `npm test` | Not configured yet; the current placeholder exits with an error. |

## Current Scope and Follow-up Questions

ResearchPilot is currently a local, interactive CLI prototype. It does not yet expose an extension API, web interface, persistent research history, or a configured automated test suite. The repository includes design diagrams and generated harness notes, but the README's description above is based on the active source paths.

When comparing this project with the VS Code extension, useful areas to investigate include search-provider abstraction, source quality and citation handling, cancellation and timeouts, tool-input validation, content and token budgeting, parallel tool execution, error recovery, observability, and tests for tool-loop behavior.
