import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { fal } from "@fal-ai/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "8mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "AI-Studio",
    assistantConfigured: Boolean(process.env.OPENAI_API_KEY),
    videoGeneration: process.env.FAL_KEY ? "fal-ai-configured" : "needs-fal-key"
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


app.post("/api/image-prompt", async (req, res) => {
  const image = req.body?.image;
  const motion = String(req.body?.motion || "Natural, cinematic movement").trim();
  const camera = String(req.body?.camera || "Slow cinematic push-in").trim();
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Image understanding needs an OpenAI API key. Add OPENAI_API_KEY in Render Environment.", setup: true });
  }
  if (typeof image !== "string" || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(image)) {
    return res.status(400).json({ error: "Upload a PNG, JPG, WEBP or GIF image first." });
  }
  if (image.length > 7_000_000) {
    return res.status(413).json({ error: "Image is too large. Please choose an image under about 5 MB." });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: [
            "Analyze this uploaded image and write a production-ready image-to-video generation prompt.",
            "Describe only visible details; preserve the identity, clothing, anatomy, objects and scene composition.",
            "Motion requested: " + motion,
            "Camera movement: " + camera,
            "Return: (1) main animation prompt, (2) camera and motion timing, (3) continuity instructions, (4) negative prompt.",
            "Do not claim to have generated a video file."
          ].join("\n") },
          { type: "input_image", image_url: image, detail: "high" }
        ]
      }]
    });
    res.json({ result: response.output_text || "No prompt returned. Please try again." });
  } catch (error) {
    console.error("Image prompt error:", error?.message || error);
    res.status(502).json({ error: "Image analysis failed. Check the OpenAI key, billing and model access." });
  }
});


app.post("/api/generate-video", async (req, res) => {
  if (!process.env.FAL_KEY) return res.status(503).json({ error: "AI video generation is not connected yet. Add FAL_KEY in Render Environment. No video has been generated or charged.", setup: true });
  const prompt = String(req.body?.prompt || "").trim();
  const image = req.body?.image;
  const duration = Number(req.body?.duration || 5);
  const aspectRatio = String(req.body?.aspectRatio || "16:9");
  const allowedRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]);
  if (!prompt) return res.status(400).json({ error: "Please enter a video prompt first." });
  if (prompt.length > 4000) return res.status(400).json({ error: "Prompt is too long. Keep it under 4,000 characters." });
  if (![5, 10].includes(duration)) return res.status(400).json({ error: "Choose a 5- or 10-second clip." });
  if (!allowedRatios.has(aspectRatio)) return res.status(400).json({ error: "Unsupported aspect ratio." });
  if (image && (typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > 7_000_000)) return res.status(400).json({ error: "Choose a PNG, JPG or WEBP image under about 5 MB." });
  try {
    fal.config({ credentials: process.env.FAL_KEY });
    const input = { prompt, duration, resolution: "768P", aspect_ratio: aspectRatio, enable_safety_checker: true, prompt_expansion_mode: "balanced", ...(image ? { image_url: image } : {}) };
    const result = await fal.subscribe(image ? "minimax/h3-max-turbo/image-to-video" : "minimax/h3-max-turbo/text-to-video", { input, logs: false });
    const videoUrl = result?.data?.video?.url;
    if (!videoUrl) throw new Error("The provider returned no video URL.");
    res.json({ videoUrl, requestId: result.requestId, duration, model: "MiniMax H3 Max Turbo" });
  } catch (error) {
    console.error("Video generation error:", error?.message || error);
    res.status(502).json({ error: "Video generation failed. Check FAL_KEY, fal.ai credits and model availability." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AI-Studio listening on port ${port}`);
});