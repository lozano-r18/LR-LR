import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  const feedUrl = "https://medianewbuild.com/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml";
  
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    const xmlText = await response.text();
    
    // We parse the XML into a small JSON on the server to stay under the 4.5MB Vercel limit.
    // This allows the website to load all properties instantly.
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const jsonObj = parser.parse(xmlText);
    
    const rawProps = jsonObj?.root?.property || jsonObj?.properties?.property || [];
    const nodes = Array.isArray(rawProps) ? rawProps : [rawProps];

    // PRUNING: We strip out 90% of the metadata but keep the ID, prices, images, and basic info.
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
            ? node.images.image.slice(0, 5).map(img => ({ url: typeof img === 'string' ? img : img.url }))
            : node.images?.image ? [{ url: typeof node.images.image === 'string' ? node.images.image : node.images.image.url }] : []
        },
        desc: { en: (node.desc?.en || node.desc?.es || '').toString().slice(0, 300) },
        url: typeof node.url === 'string' ? node.url : (node.url?.en || node.url?.es || ''),
        features: { feature: Array.isArray(node.features?.feature) ? node.features.feature.slice(0, 5) : [] },
        pool: node.pool
    }));

    const result = { properties: { property: pruned } };
    const jsonStr = JSON.stringify(result);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (typeof res.status === 'function') {
      return res.status(200).send(jsonStr);
    } else {
      res.statusCode = 200;
      return res.end(jsonStr);
    }
  } catch (error) {
    console.error('SERVER ERROR:', error);
    const errObj = JSON.stringify({ error: 'Failed', details: error.message });
    if (typeof res.status === 'function') {
      res.status(500).send(errObj);
    } else {
      res.statusCode = 500;
      res.end(errObj);
    }
  }
}
