# 🎬 AI-Studio

AI-Studio is a mobile-friendly creator workspace for AI-assisted video planning and browser-based clip editing.

## What works now

- Responsive dark creator dashboard
- AI assistant endpoint for scripts, storyboards, shot prompts, titles and captions (requires your own OpenAI API key)
- Text-to-video planning workflow
- Image-to-video prompt planning workflow with local image preview
- Local video preview, trim-range controls and browser-side WebM export
- Health endpoint for deployment checks
- API keys remain on the server; never place them in frontend code or commit them to Git

## Important capability note

This repository does **not** include a video-generation model or paid generation-provider credentials. Text-to-video and image-to-video screens currently prepare production prompts; they do not claim to render AI-generated footage. To enable actual generation, a video provider API and its credentials must be selected and integrated.

## Run locally

Requirements: Node.js 20+

```bash
git clone https://github.com/Rajkumarmaker/AI-studio.git
cd AI-studio
npm install
cp .env.example .env
```

Add your key to `.env` (keep it private):

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3000
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000

## Deploy on Render

Create a **Web Service** connected to this repository.

- Branch: `ai-studio`
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Add `OPENAI_API_KEY` in the Render Environment settings (optional; needed for AI assistant)
- Health check path: `/api/health`

Do not paste API keys into GitHub files or chat.

## Main files

- `server.js` — Express server and protected OpenAI API route
- `public/index.html` — app interface
- `public/styles.css` — responsive styling
- `public/app.js` — assistant, image preview and browser video editor
- `.env.example` — safe environment variable template

## Current status

- [x] Core UI and responsive navigation
- [x] OpenAI script/prompt assistant API integration
- [x] Text-to-video scene planning
- [x] Image-to-video prompt planning
- [x] Local video preview and trim export (WebM, browser-dependent)
- [ ] Actual AI video rendering provider integration
- [ ] Multi-clip timeline, cloud projects and 4K export

## Security

Never commit `.env`, API keys, access tokens or private credentials. Use environment variables in your hosting provider.
