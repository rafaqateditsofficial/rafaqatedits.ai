# Rafaqat Editors AI (flat version)
Files: `index.html`, `_worker.js` (server + AI settings), `logo.png`, `banner.jpg`. Everything sits in one folder, so it uploads easily from a phone. Cloudflare Pages detects `_worker.js` automatically.


Static front end (`index.html`) + one serverless function (`functions/api/generate.js`). Your API key lives only on the server as a secret, never in the browser.

## Structure
- `index.html` – the whole site (HTML, CSS, JS)
- `_worker.js` (top section) – provider URL, model, and the prompt for each tool
- `functions/api/generate.js` – secure API endpoint

## Run locally
1. Install Node.js 18+.
2. In this folder, create a file named `.dev.vars` containing: `AI_API_KEY=your_key_here`
3. Run: `npx wrangler pages dev .`
4. Open http://localhost:8788

(Add `.dev.vars` to `.gitignore`. Without a key, the site loads and tools show a setup message.)

## Deploy free on Cloudflare Pages
1. Push this folder to a GitHub repository.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: leave empty. Output directory: `/` (root). Click Save and Deploy.
4. **Add your API key:** project → Settings → Variables and Secrets → add `AI_API_KEY` as a Secret (Production and Preview) → redeploy.
5. Optional: Custom domains tab to connect your own domain.

No Git? Run `npx wrangler pages deploy .` instead.

## Change provider or model
Edit `_worker.js` (top section). If your provider is not Anthropic-compatible, adjust the headers and response parsing in `generate.js`.

## Contact form
It opens the visitor's email app. Replace `hello@example.com` in `index.html` with your address.

## AI Chat
The chat section uses `functions/api/chat.js` with the same `AI_API_KEY` secret. Its personality is `CHAT_SYSTEM` in `config.js`.

## Voice and photos in AI Chat
- Voice: the Speak button uses the browser's built-in speech recognition (best in Chrome or Edge, Hindi/Urdu/English). Replies can be read aloud. No extra key needed.
- Photos: the chat can look at an attached photo and answer questions about it. It cannot edit or generate images; that needs a separate image provider.
- Cost: every message uses your API credit. To limit cost, lower `maxTokens` in `config.js` or add Cloudflare rate limiting.

## Creator Studio (free, runs in the browser)
Photo Studio (brightness, contrast, color, name on photo, PNG download), Video Maker (photos to a downloadable slideshow video with the brand name), and Voice Maker (reads text aloud in Hindi/Urdu/English). No API key and no cost. AI-generated images, video and downloadable voice files need a paid provider and are not included.

## Free address and Google
- Free address: Cloudflare gives you `your-project.pages.dev` at no cost. No domain purchase needed.
- `/robots.txt` and `/sitemap.xml` are generated automatically with your real address.
- Get found on Google: go to search.google.com/search-console, add your `pages.dev` address as a URL prefix, verify it (HTML tag method: paste the tag inside `<head>` in `index.html`, redeploy), then submit `sitemap.xml`. Do the same at bing.com/webmasters.
- No one can guarantee ranking. Searches for the exact name "Rafaqat Editors AI" usually work within days to weeks after Google indexes the site. Sharing the link on YouTube, Instagram and TikTok helps.
