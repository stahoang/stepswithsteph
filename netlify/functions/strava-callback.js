// netlify/functions/strava-callback.js
// Step 2 of Strava OAuth — Strava redirects here with ?code=...
// We exchange that code for an access token + refresh token, then
// send everything back to the frontend via URL hash so the page
// can store it in localStorage and show the connected state.

exports.handler = async (event) => {
  const { code, error } = event.queryStringParameters || {};
  const appUrl = process.env.APP_URL || "/";

  // User denied access on Strava's side
  if (error) {
    return {
      statusCode: 302,
      headers: { Location: `${appUrl}/#strava-error=${encodeURIComponent(error)}` },
      body: "",
    };
  }

  if (!code) {
    return {
      statusCode: 302,
      headers: { Location: `${appUrl}/#strava-error=missing_code` },
      body: "",
    };
  }

  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Strava token exchange failed:", err);
      return {
        statusCode: 302,
        headers: { Location: `${appUrl}/#strava-error=token_exchange_failed` },
        body: "",
      };
    }

    const data = await res.json();

    // Pass tokens to the frontend via URL hash (keeps them out of server logs)
    const params = new URLSearchParams({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      athlete_name:  data.athlete?.firstname || "",
      athlete_id:    String(data.athlete?.id || ""),
    });

    return {
      statusCode: 302,
      headers: { Location: `${appUrl}/#strava-connected&${params.toString()}` },
      body: "",
    };
  } catch (err) {
    console.error("strava-callback error:", err);
    return {
      statusCode: 302,
      headers: { Location: `${appUrl}/#strava-error=server_error` },
      body: "",
    };
  }
};
