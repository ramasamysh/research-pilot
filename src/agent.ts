import Anthropic from "@anthropic-ai/sdk"

import { anthropic } from "./clients.js";
import { config } from "./config.js";
import { systemPrompt } from "./prompts.js";

import { executeTool } from "./tools/executor.js";
import { researchTools } from "./tools/definitions.js";

export async function research(
    question: string,
): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
        {
            role: "user",
            content: question,
        },
    ];

    let toolCallCount = 0;

    while (true) {
        const toolsAvailable =
            toolCallCount < config.maxToolCalls;

        const response = await anthropic.messages.create({
            model: config.model,

            max_tokens: config.maxOutputTokens,

            system: systemPrompt,

            messages,

            tools: toolsAvailable
                ? researchTools
                : [],
        });

        /*
         * No more tools requested.
         *
         * Claude has either finished,
         * refused,
         * hit a token limit,
         * etc.
         */
        if (response.stop_reason !== "tool_use") {
            return extractFinalText(response);
        }

        /*
         * Save Claude's complete response.
         *
         * IMPORTANT:
         * don't save only the text.
         * The tool_use blocks are part of conversation state.
         */
        messages.push({
            role: "assistant",
            content: response.content,
        });

        const toolUses = response.content.filter(
            (
                block,
            ): block is Anthropic.ToolUseBlock =>
                block.type === "tool_use",
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUses) {
            toolCallCount++;

            console.log(
                `\n[tool ${toolCallCount}/${config.maxToolCalls}] ${toolUse.name}`,
            );

            console.log(
                JSON.stringify(toolUse.input, null, 2),
            );

            if (toolCallCount > config.maxToolCalls) {
                toolResults.push({
                    type: "tool_result",

                    tool_use_id: toolUse.id,

                    is_error: true,

                    content:
                        "Research tool budget exhausted. Use the evidence already collected and produce the best possible final answer.",
                });

                continue;
            }

            try {
                const result = await executeTool(
                    toolUse.name,
                    toolUse.input,
                );

                toolResults.push({
                    type: "tool_result",

                    tool_use_id: toolUse.id,

                    content: result,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);

                console.error(
                    `[tool error] ${message}`,
                );

                toolResults.push({
                    type: "tool_result",

                    tool_use_id: toolUse.id,

                    content: message,

                    is_error: true,
                });
            }
        }

        /*
         * Send observations/results back to Claude.
         */
        messages.push({
            role: "user",
            content: toolResults,
        });
    }
}

function extractFinalText(
    response: Anthropic.Message,
): string {
    const text = response.content
        .filter(
            (
                block,
            ): block is Anthropic.TextBlock =>
                block.type === "text",
        )
        .map((block) => block.text)
        .join("\n");

    if (text.trim()) {
        return text;
    }

    return `Research stopped without a text response. stop_reason=${response.stop_reason}`;
}

// export async function runAgent(input: string) {
//   const response = await anthropic.messages.create({
//     model: config.model,
//     max_tokens: 1024,
//     system: systemPrompt,
//     messages: [{ role: "user", content: input }]
//   });

//   return response.content;
// }
