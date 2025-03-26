import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { createActionItem } from "./createActionItem";

const CreateActionItemSchema = z.object({
  title: z.string().describe("Title of Action Item"),
  status: z.string().describe("Status of Action Item"),
});

async function main() {
  const server = new Server({
    name: "lyearn",
    version: "1.0.0",
    capabilities: {
      tools: {},
    },
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Return available resources
    return {
      resources: [
        {
          id: "action_items",
          name: "Action Items",
          description: "Manage action items and their status",
          type: "collection"
        }
      ]
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    // Return available prompts
    return {
      prompts: [
        {
          id: "create_action_item",
          name: "Create Action Item",
          description: "Create a new action item with title and status",
          inputSchema: zodToJsonSchema(CreateActionItemSchema)
        }
      ]
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "create_action_item",
        description: "Create a new Action Item",
        inputSchema: zodToJsonSchema(CreateActionItemSchema),
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    let parsedArgs = args;

    try {
      if (typeof args === "string") {
        parsedArgs = JSON.parse(args);
      }

      if (name === "create_action_item") {
        const validatedArgs = CreateActionItemSchema.safeParse(parsedArgs);

        if (!validatedArgs.success) {
          return { error: "Invalid arguments provided" };
        }

        // Call the createActionItem function with the validated title
        await createActionItem(validatedArgs.data.title);
        return {
          content: [
            {
              type: "text",
              text: `Successfully created action item: ${validatedArgs.data.title}`,
            },
          ],
        };
      } else {
        return {
          content: [{ type: "text", text: "Nothing happened" }],
        };
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `An error occurred while processing the request: ${error?.message || 'Unknown error'}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});