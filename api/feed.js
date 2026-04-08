export default async function handler(req, res) {
  const feedUrl = "https://medianewbuild.com/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml";
  
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
    
    const xmlText = await response.text();
    
    // STRIPPED DOWN PASS-THROUGH
    // We send the RAW XML back. The browser (App.tsx) already has the logic to parse it.
    // This removes the "fast-xml-parser" dependency requirement on the backend entirely.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    
    if (typeof res.status === 'function') {
      return res.status(200).send(xmlText);
    } else {
      res.statusCode = 200;
      return res.end(xmlText);
    }
  } catch (error) {
    console.error('Error fetching the properties feed:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch the properties feed', details: error.message }));
  }
}
