# Clinical Unit Simulator

Upload lecture slides and get a simulated hospital unit with patients, a shift prep challenge, quizzes, XP and badges.

## Files

- `index.html`: the whole site
- `api/claude.js`: a small server function that sends requests to Claude with your Anthropic API key, which stays on the server
- `vercel.json`: gives the function up to 5 minutes, because building a unit takes a minute or two
- `package.json`: marks the project as an ES module

## Deploy to Vercel

### Option A: from the terminal

```bash
npm install -g vercel
cd clinical-unit-simulator
vercel login
vercel                      # first deploy; accept the defaults
vercel env add ANTHROPIC_API_KEY production
vercel env add ACCESS_CODE production      # optional class code
vercel --prod               # redeploy so the variables take effect
```

### Option B: from GitHub

1. Create a new GitHub repository and upload these files (keep the `api` folder).
2. Go to vercel.com → **Add New… → Project** → import the repository → **Deploy**. Leave Framework Preset as **Other**.
3. In the project: **Settings → Environment Variables**. Add `ANTHROPIC_API_KEY` (and `ACCESS_CODE` if you want one).
4. **Deployments** → open the latest one → **Redeploy**. Variables only apply to new deployments.

## Environment variables

| Name | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your key from console.anthropic.com. Without it, only the demo unit works. |
| `ACCESS_CODE` | No | If set, the page asks for this code before building a unit, so strangers can't spend your credits. |
| `ANTHROPIC_MODEL` | No | Overrides the model (default `claude-sonnet-5-5`; quick replies use `claude-haiku-5-5`). |

Set a monthly spending limit in the Anthropic Console. Anyone with the link (and the code, if you set one) uses your credits.

## Check that it works

Open `https://your-project.vercel.app/api/claude`. You should see `{"ok":true,"configured":true,...}`.
