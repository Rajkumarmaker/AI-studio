import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "AI-Studio",
    assistantConfigured: Boolean(process.env.OPENAI_API_KEY),
    videoGeneration: "provider-not-configured"
  });
});

app.post("/api/assistant", async (req, res) => {
  const idea = String(req.body?.idea || "").trim();
  const task = String(req.body?.task || "script").trim();
  const style = String(req.body?.style || "cinematic documentary").trim();
  const duration = Math.min(600, Math.max(5, Number(req.body?.duration || 30)));

  if (!idea) return res.status(400).json({ error: "Please enter a video idea first." });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI assistant is not connected yet. Add OPENAI_API_KEY in Render Environment to enable it.",
      setup: true
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = [
      "You are the creative assistant inside AI-Studio, a video planning and editing workspace.",
      "Return useful, production-ready content. Do not claim that a video file has been rendered.",
      `Task: ${task}`,
      `Video idea: ${idea}`,
      `Visual style: ${style}`,
      `Target duration: ${duration} seconds`,
      "For a script, provide a concise hook, timestamped scenes, voiceover/dialogue, visual prompts, and sound design.",
      "For scene prompts, provide numbered shot prompts with camera movement, subject action, lighting, and continuity notes.",
      "For captions, provide a title, short description, and platform-ready captions.",
      "Use clear headings and practical details."
    ].join("\n");

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: prompt
    });
    res.json({ result: response.output_text || "No text returned. Please try again." });
  } catch (error) {
    console.error("Assistant error:", error?.message || error);
    res.status(502).json({ error: "The AI provider request failed. Check your API key, billing, and model settings." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AI-Studio listening on port ${port}`);
});