import "dotenv/config";

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function numberFromEnv(name: string, defaultValue: number): number {
    const value = process.env[name];

    if (!value) {
        return defaultValue;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        throw new Error(`${name} must be a number`);
    }

    return parsed;
}

export const config = {
    anthropicApiKey: required("ANTHROPIC_API_KEY"),
    tavilyApiKey: required("TAVILY_API_KEY"),

    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5",

    maxToolCalls: numberFromEnv("MAX_TOOL_CALLS", 10),
    maxOutputTokens: numberFromEnv("MAX_OUTPUT_TOKENS", 6000),
};
