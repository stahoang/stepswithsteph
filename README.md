# Steps with Steph 🏃‍♀️

Your personal 16-week training plan for Big Sur (Apr 26) and the SF Half Marathon (Jul 26).

---

## Get it live in 3 steps

### Step 1 — Push to GitHub (5 min)

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Click **New Repository** → name it `stepswithsteph` → set to **Public** → click **Create**
3. On your computer, open Terminal (Mac) or Command Prompt (Windows) in this folder and run:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stepswithsteph.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

> **No Terminal?** You can also drag and drop all the files directly into the GitHub web interface after creating the repo.

---

### Step 2 — Deploy on Netlify (5 min, free)

1. Go to [netlify.com](https://netlify.com) and sign up (free) — use "Sign up with GitHub"
2. Click **Add new site** → **Import an existing project** → **GitHub**
3. Authorize Netlify and select your `stepswithsteph` repository
4. Leave all build settings as-is (Netlify reads `netlify.toml` automatically)
5. Click **Deploy site**

You'll get a live URL like `cosmic-runner-abc123.netlify.app` in about 30 seconds.

**To rename it:** Netlify dashboard → Site Configuration → Change site name → type `stepswithsteph`
Your URL becomes `stepswithsteph.netlify.app`.

---

### Step 3 — Connect Strava (15 min)

#### 3a. Create your Strava API app

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Fill in:
   - **Application Name:** Steps with Steph
   - **Category:** Training
   - **Club:** (leave blank)
   - **Website:** `https://stepswithsteph.netlify.app`
   - **Authorization Callback Domain:** `stepswithsteph.netlify.app`
     ⚠️ No `https://`, no trailing slash — just the bare domain
3. Click **Save** and note your **Client ID** and **Client Secret**

#### 3b. Add environment variables in Netlify

1. In Netlify → your site → **Site Configuration** → **Environment Variables**
2. Add these three variables:

| Key | Value |
|-----|-------|
| `STRAVA_CLIENT_ID` | Your Client ID from Strava (just the number) |
| `STRAVA_CLIENT_SECRET` | Your Client Secret from Strava |
| `APP_URL` | `https://stepswithsteph.netlify.app` |

3. Click **Save**, then go to **Deploys** → **Trigger deploy** → **Deploy site** to pick up the new variables

#### 3c. Connect in the app

1. Open your live site
2. Go to **Run Log** tab
3. Click **Connect Strava**
4. Authorize on Strava's page
5. You'll be redirected back and your runs will sync automatically ✓

---

## Custom domain (optional, ~$10/year)

1. Buy a domain at [namecheap.com](https://namecheap.com) — e.g. `stepswithsteph.com`
2. In Netlify → **Domain Management** → **Add a domain** → enter your domain
3. Follow Netlify's instructions to update your nameservers at Namecheap
4. Netlify auto-provisions a free SSL certificate (takes ~10 min to propagate)

---

## Local development (optional)

If you want to run the site locally with the Strava functions working:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Copy env file and fill in your keys
cp .env.example .env

# Run locally
netlify dev
```

Open `http://localhost:8888`

---

## Project structure

```
stepswithsteph/
├── index.html                    ← The full app
├── netlify.toml                  ← Netlify config (routes /api/* to functions)
├── .env.example                  ← Copy to .env for local dev
├── .gitignore                    ← Keeps .env out of git
├── README.md                     ← This file
└── netlify/
    └── functions/
        ├── strava-auth.js        ← Redirects to Strava login
        ├── strava-callback.js    ← Handles OAuth token exchange
        └── strava-sync.js        ← Fetches your runs from Strava API
```

---

## How the Strava sync works

```
You click "Connect Strava"
        ↓
/api/strava-auth  →  redirects to strava.com/oauth/authorize
        ↓
Strava asks you to approve access
        ↓
Strava redirects to /api/strava-callback?code=...
        ↓
strava-callback.js exchanges the code for tokens, redirects back to app
        ↓
App stores tokens in localStorage, shows "Sync Runs" button
        ↓
You click "Sync Runs"  →  POST /api/strava-sync
        ↓
strava-sync.js fetches your 50 most recent runs from Strava API
        ↓
Runs appear in your log table with an orange STRAVA badge
```

Your Strava credentials (Client ID and Secret) **never leave the server** — they live in Netlify's environment variables, not in the frontend code.

---

Made with ❤️ for Steph's journey to Big Sur and the SF Half.
