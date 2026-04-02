// netlify/functions/strava-sync.js
// Fetches the athlete's recent Strava runs and returns them
// formatted for the Steps with Steph run log.
// Automatically refreshes an expired access token if needed.
//
// POST /api/strava-sync
// Body: { access_token, refresh_token, expires_at, per_page? }
// Returns: { runs: [...], new_access_token?, new_expires_at? }

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  let { access_token, refresh_token, expires_at, per_page = 50 } = body;

  if (!access_token || !refresh_token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "access_token and refresh_token are required" }),
    };
  }

  // ── Refresh token if expired (or expires within 5 min) ──────────────────
  let refreshedToken = null;

  if (Date.now() / 1000 > Number(expires_at) - 300) {
    try {
      const refreshRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type:    "refresh_token",
          refresh_token,
        }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        access_token  = refreshData.access_token;
        refreshedToken = {
          new_access_token: refreshData.access_token,
          new_expires_at:   refreshData.expires_at,
        };
      }
      // If refresh fails, carry on with the existing token — it may still work
    } catch (err) {
      console.error("Token refresh error:", err);
    }
  }

  // ── Fetch activities from Strava ─────────────────────────────────────────
  try {
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${per_page}&page=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!activitiesRes.ok) {
      const errText = await activitiesRes.text();
      console.error("Strava activities fetch error:", errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed to fetch activities from Strava. Try reconnecting." }),
      };
    }

    const activities = await activitiesRes.json();

    // Filter to runs only, map to app format
    const runs = activities
      .filter((a) => ["Run", "VirtualRun", "TrailRun"].includes(a.type))
      .map((a) => {
        const distMiles       = a.distance / 1609.344;
        const movingSecs      = a.moving_time;
        const paceSecPerMile  = distMiles > 0 ? movingSecs / distMiles : 0;
        const paceMin         = Math.floor(paceSecPerMile / 60);
        const paceSec         = Math.round(paceSecPerMile % 60).toString().padStart(2, "0");

        return {
          id:        `strava-${a.id}`,
          strava_id: a.id,
          source:    "strava",
          date:      a.start_date_local.split("T")[0],
          dist:      parseFloat(distMiles.toFixed(2)),
          pace:      paceSecPerMile > 0 ? `${paceMin}:${paceSec}` : "",
          type:      inferType(a),
          hr:        a.average_heartrate ? Math.round(a.average_heartrate) : "",
          effort:    a.perceived_exertion || "",
          notes:     a.name || "",
          elevation: a.total_elevation_gain
            ? Math.round(a.total_elevation_gain * 3.28084) // metres → feet
            : 0,
        };
      });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runs, ...refreshedToken }),
    };
  } catch (err) {
    console.error("strava-sync error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error. Please try again." }) };
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function inferType(activity) {
  const name = (activity.name || "").toLowerCase();
  const dist = activity.distance / 1609.344;

  if (activity.workout_type === 1) return "Race";
  if (activity.workout_type === 3) return "Intervals";
  if (activity.workout_type === 2) return "Tempo";
  if (dist >= 9)                    return "Long Run";
  if (name.includes("tempo"))       return "Tempo";
  if (/interval|track|repeat/.test(name)) return "Intervals";
  if (name.includes("long"))        return "Long Run";
  if (/race|marathon|half|5k|10k/.test(name)) return "Race";
  return "Easy Run";
}
