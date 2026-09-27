import Anthropic from "@anthropic-ai/sdk";

// export type ToolDefinition = {
//     name: string;
//     description: string;
//     input_schema: {
//         type: string;
//         properties: Record<string, unknown>;
//         required?: string[];
//     };
// };

// there are contracts
export const researchTools: Anthropic.Tool[] = [
    {
        name: "web_search",

        description:
            "Search the public web using Tavily. Use this to discover current, relevant sources before answering research questions.",

        input_schema: {
            type: "object",

            properties: {
                query: {
                    type: "string",
                    description:
                        "A focused web search query. Prefer a specific research sub-question rather than the entire user request.",
                },

                search_depth: {
                    type: "string",
                    enum: ["basic", "advanced"],
                    description:
                        "Use basic for simple discovery and advanced when deeper relevance is important.",
                },

                max_results: {
                    type: "integer",
                    minimum: 1,
                    maximum: 10,
                    description: "Maximum number of search results.",
                },

                topic: {
                    type: "string",
                    enum: ["general", "news"],
                    description:
                        "Use general for normal technical research and news for recent developments.",
                },
            },

            required: ["query"],
        },
    },

    {
        name: "extract_pages",

        description:
            "Retrieve clean page content from URLs discovered during research. Use this after web_search when you need deeper evidence from promising sources.",

        input_schema: {
            type: "object",

            properties: {
                urls: {
                    type: "array",

                    items: {
                        type: "string",
                    },

                    minItems: 1,
                    maxItems: 5,

                    description:
                        "URLs previously discovered through web_search that should be read more deeply.",
                },

                extract_depth: {
                    type: "string",
                    enum: ["basic", "advanced"],
                    description:
                        "Use advanced when pages contain complex or detailed technical material.",
                },
            },

            required: ["urls"],
        },
    }
];
