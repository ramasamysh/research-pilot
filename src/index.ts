// import { anthropic } from "./clients.js";
// import { config } from "./config.js";

// async function main() {
//   console.log("Research Pilot starting...");
//   console.log("Model:", config.model);

//   try {
//     const response = await anthropic.messages.create({
//       model: config.model,
//       max_tokens: 64,
//       messages: [{ role: "user", content: "Hello from Research Pilot." }]
//     });

//     console.log(response.content[0]);
//   } catch (error) {
//     console.error("Failed to initialize Anthropic client:", error);
//   }
// }

// main();

import {
    createInterface,
} from "node:readline/promises";

import {
    stdin as input,
    stdout as output,
} from "node:process";

import { research } from "./agent.js";

async function main() {
    const readline = createInterface({
        input,
        output,
    });

    console.log(`=================================
        ResearchPilot
        Evidence-driven research agent
        =================================`);

    while (true) {
        const question = await readline.question(
            "\nResearch question (or 'exit'):\n> ",
        );

        const cleanedQuestion = question.trim();

        if (!cleanedQuestion) {
            continue;
        }

        if (
            cleanedQuestion.toLowerCase() === "exit"
        ) {
            break;
        }

        console.log("\nResearching...");

        try {
            const answer = await research(
                cleanedQuestion,
            );

            console.log("\n");
            console.log(answer);
        } catch (error) {
            console.error("\nResearch failed:");

            console.error(
                error instanceof Error
                    ? error.message
                    : error,
            );
        }
    }

    readline.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});