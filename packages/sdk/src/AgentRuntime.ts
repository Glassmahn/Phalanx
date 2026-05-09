import { readFileSync } from "fs";
import { join } from "path";
import type { Locus } from "./types";
import OpenAI from "openai";

export class AgentRuntime {
  private openai: OpenAI;
  private systemPrompt: string;
  private role: string;

  constructor(role: string, promptsDir: string, apiKey: string) {
    this.role = role;
    this.openai = new OpenAI({ apiKey });

    const promptPath = join(promptsDir, `${role}.md`);
    this.systemPrompt = readFileSync(promptPath, "utf-8");
  }

  async think(
    context: { palaceLoci: Locus[]; instruction: string; extra?: Record<string, unknown> },
    model = "gpt-4o-mini"
  ): Promise<Record<string, unknown>> {
    const palaceSummary = context.palaceLoci
      .map((l) => `[${l.phase} @${l.timestamp}] ${l.agent_role}: ${JSON.stringify(l.content)}`)
      .join("\n");

    const userMessage = [
      `=== USER INTENT ===\n${context.instruction}`,
      context.extra ? `\n=== EXTRA CONTEXT ===\n${JSON.stringify(context.extra)}` : "",
      `\n=== WALRUS PALACE (${context.palaceLoci.length} loci) ===\n${palaceSummary || "(empty palace)"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error(`${this.role} returned empty response`);

    return JSON.parse(content) as Record<string, unknown>;
  }
}
