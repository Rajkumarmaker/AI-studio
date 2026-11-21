# 🎬 AI-Studio

AI-Studio is a mobile-friendly creator workspace for AI-assisted video planning and browser-based clip editing.

## What works now

- Responsive dark creator dashboard
- AI assistant endpoint for scripts, storyboards, shot prompts, titles and captions (requires your own OpenAI API key)
- Text-to-video planning workflow
- Optional real text-to-video and image-to-video rendering via fal.ai MiniMax H3 Max Turbo (requires FAL_KEY and prepaid credits)
- Image-to-video prompt planning workflow with local image preview
- Local video preview, trim-range controls and browser-side WebM export
- Health endpoint for deployment checks
- API keys remain on the server; never place them in frontend code or commit them to Git

## Important capability note

Real AI video generation is integrated with fal.ai MiniMax H3 Max Turbo. It stays disabled until you add your own FAL_KEY in Render Environment and buy provider credits. The app displays estimated pricing and only sends a billable request after you press Generate. Check current fal.ai pricing before use.

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
FAL_KEY=your_fal_key_here
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
- [x] fal.ai real AI video generation routes (requires FAL_KEY and provider credits)
- [ ] Multi-clip timeline, cloud projects and 4K export

## Security

Never commit `.env`, API keys, access tokens or private credentials. Use environment variables in your hosting provider.
