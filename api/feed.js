const FEED_URL =
  'https://medianewbuild.com/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml';

export default async function handler(req, res) {
  try {
    const upstream = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'LozanoRealty/1.0' },
    });

    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.end(`Upstream error: ${upstream.status}`);
      return;
    }

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const body = await upstream.arrayBuffer();
    res.statusCode = 200;
    res.end(Buffer.from(body));
  } catch (err) {
    res.statusCode = 500;
    res.end(`Feed proxy error: ${err.message}`);
  }
}
