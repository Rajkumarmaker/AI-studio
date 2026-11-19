# 🎬 AI-Studio

> **Next-generation AI video creation and editing suite** — empowering creators worldwide with text-to-video, image-to-video, intelligent editing workflows, and ChatGPT-powered assistance.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![AI Powered](https://img.shields.io/badge/AI-Video%20%26%20ChatGPT-purple.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)]()

---

## 🌟 Overview

**AI-Studio** is an all-in-one creative platform built for content creators, filmmakers, and digital storytellers. Turn ideas into high-impact videos using natural language prompts, animate static visuals, streamline post-production with intelligent AI editing tools, and generate scripts, ideas, and prompts using built-in **ChatGPT (OpenAI)** access.

---

## ✨ Key Features

* **🤖 ChatGPT AI Assistant Access:** Generate video scripts, scene prompts, captions, titles, and creative ideas directly inside the workflow via OpenAI / ChatGPT API.
* **📝 Text-to-Video Generation:** Transform scripts, ideas, and detailed prompts into dynamic video scenes.
* **🖼️ Image-to-Video Animation:** Bring static photos, illustrations, and artwork to life with smooth motion and camera controls.
* **✂️ Smart AI Video Editing:** Accelerate cuts, transitions, scene pacing, and visual enhancements automatically.
* **🎨 Style & Motion Control:** Customize visual themes, aspect ratios (`16:9`, `9:16`, `1:1`), frame rates, and motion intensity.
* **⚡ Creator-First Workflow:** Designed for fast previews, effortless iteration, and high-quality exports.

---

## 🗺️ Roadmap

- [x] Core project architecture & UI foundation
- [ ] ChatGPT (OpenAI API) script & prompt assistant integration
- [ ] Text-to-video generation pipeline
- [ ] Image-to-video animation & camera motion controls
- [ ] AI-assisted timeline & smart video editor
- [ ] Custom presets, batch rendering, and 4K export

---

## 🔐 ChatGPT / OpenAI Configuration

Add your OpenAI API key in your environment variables (`.env`) to enable ChatGPT features:

```env
OPENAI_API_KEY=your_openai_api_key_here
# 1. Clone the repository
git clone [https://github.com/your-username/AI-studio.git](https://github.com/your-username/AI-studio.git)

# 2. Enter the project folder
cd AI-studio

# 3. Configure environment variables
cp .env.example .env

# 4. Install dependencies & run
npm install
npm run dev
---

### 2. ChatGPT API कोड (JavaScript / Node.js)

पहले इंस्टॉल करें: `npm install openai dotenv`

```javascript
import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateVideoScriptAndPrompt(idea) {
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: `Create a short video script and a visual scene prompt for this idea: ${idea}`,
  });

  return response.output_text;
}

// Test run
generateVideoScriptAndPrompt("A space explorer discovering a glowing forest on Mars")
  .then(console.log)
  .catch(console.error);import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_video_script_and_prompt(idea: str) -> str:
    response = client.responses.create(
        model="gpt-4o-mini",
        input=f"Create a short video script and a visual scene prompt for this idea: {idea}",
    )
    return response.output_text

if __name__ == "__main__":
    result = generate_video_script_and_prompt("A space explorer discovering a glowing forest on Mars")
    print(result)


