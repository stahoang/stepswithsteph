// netlify/functions/strava-auth.js
// Step 1 of Strava OAuth — redirects the user to Strava's authorization page.
// Called when user clicks "Connect Strava" in the Run Log tab.
// Strava then redirects back to /api/strava-callback with ?code=...

exports.handler = async () => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const appUrl   = process.env.APP_URL;

  if (!clientId || !appUrl) {
    return {
      statusCode: 500,
      body: "Missing STRAVA_CLIENT_ID or APP_URL environment variables. Add them in Netlify → Site Settings → Environment Variables.",
    };
  }

  const redirectUri = `${appUrl}/api/strava-callback`;
  const scope       = "activity:read_all";

  const stravaUrl = [
    "https://www.strava.com/oauth/authorize",
    `?client_id=${clientId}`,
    `&response_type=code`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&approval_prompt=force`,
    `&scope=${scope}`,
  ].join("");

  return {
    statusCode: 302,
    headers: { Location: stravaUrl },
    body: "",
  };
};
