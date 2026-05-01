export async function POST(request) {
  try {
    const body = await request.json();
    const { shareUrl } = body || {};
    if (!shareUrl || typeof shareUrl !== "string") {
      return Response.json({ error: "shareUrl required" }, { status: 400 });
    }

    const res = await fetch(shareUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      return Response.json(
        {
          error: `Failed to fetch share page [${res.status}] ${res.statusText}`,
        },
        { status: 502 },
      );
    }
    const html = await res.text();

    // 1) Direct .mp3 URL in the page
    let m = html.match(/https?:\/\/[^\s"'<>]+\.mp3/);
    if (m && m[0]) {
      return Response.json({ mp3Url: m[0] });
    }

    // 2) JSON attribute like "audio_url":"...mp3"
    m = html.match(/"audio_url"\s*:\s*"(https?:[^\"]+\.mp3)"/);
    if (m && m[1]) {
      return Response.json({ mp3Url: m[1] });
    }

    // 3) Other CDN patterns
    m = html.match(/https?:\/\/cdn[^\s"'<>]+\.mp3/);
    if (m && m[0]) {
      return Response.json({ mp3Url: m[0] });
    }

    return Response.json(
      { error: "Could not locate MP3 URL on page" },
      { status: 404 },
    );
  } catch (e) {
    console.error("/api/suno/resolve error", e);
    return Response.json({ error: "Resolver crashed" }, { status: 500 });
  }
}
