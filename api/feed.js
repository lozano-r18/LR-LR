import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  const feedUrl = "https://medianewbuild.com/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml";
  
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const jsonObj = parser.parse(xmlText);
    
    // VERCEL 4.5MB LIMIT FIX:
    // We keep ONLY the core property array. This is the exact structure App.tsx expects.
    // We prune the descriptions and image arrays heavily on the server to save 90% of the payload.
    const rawProps = jsonObj?.root?.property || jsonObj?.properties?.property || [];
    const nodes = Array.isArray(rawProps) ? rawProps : [rawProps];

    const pruned = nodes.map(node => ({
        id: (node.id || node.ref || Math.random()).toString(),
        ref: (node.ref || '').toString(),
        price: Number(node.price) || 0,
        type: (node.type || 'Property').toString(),
        town: (node.town || '').toString(),
        province: (node.province || '').toString(),
        new_build: node.new_build,
        beds: parseInt(node.beds) || 0,
        baths: parseInt(node.baths) || 0,
        surface_area: { built: node.surface_area?.built || 0 },
        location_detail: (node.location_detail || '').toString(),
        images: { 
          image: Array.isArray(node.images?.image) 
            ? node.images.image.slice(0, 10).map(img => ({ url: typeof img === 'string' ? img : img.url }))
            : node.images?.image ? [{ url: typeof node.images.image === 'string' ? node.images.image : node.images.image.url }] : []
        },
        desc: { en: (node.desc?.en || node.desc?.es || '').toString().slice(0, 400) },
        url: typeof node.url === 'string' ? node.url : (node.url?.en || node.url?.es || ''),
        features: { feature: Array.isArray(node.features?.feature) ? node.features.feature.slice(0, 8) : [] },
        pool: node.pool,
        plans: node.plans
    }));

    const result = { properties: { property: pruned } };
    const jsonStr = JSON.stringify(result);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // EXPLICIT RESPONSE TO BYPASS AUTO-STRINGIFY ISSUES
    if (typeof res.status === 'function') {
      return res.status(200).send(jsonStr);
    } else {
      res.statusCode = 200;
      return res.end(jsonStr);
    }
  } catch (error) {
    console.error('SERVER ERROR:', error);
    const errBody = JSON.stringify({ error: 'Failed', details: error.message });
    if (typeof res.status === 'function') {
      return res.status(500).send(errBody);
    } else {
      res.statusCode = 500;
      return res.end(errBody);
    }
  }
}
