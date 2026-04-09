import { XMLParser } from 'fast-xml-parser';

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

    const xmlText = await upstream.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const rawData = parser.parse(xmlText);
    
    let properties = rawData?.root?.property || rawData?.properties?.property || [];
    properties = Array.isArray(properties) ? properties : [properties];
    
    // We strip down the massive XML structure into a lightweight JSON array.
    // This drops the payload size from 29MB to ~2MB, entirely preventing iOS Safari Out-of-Memory crashes!
    const lightweight = properties.map(node => {
      let images = [];
      if (node.images?.image) {
        images = (Array.isArray(node.images.image) ? node.images.image : [node.images.image])
          .map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
      }
      return {
        id: node.id, ref: node.ref, type: node.type, town: node.town, province: node.province,
        location_detail: node.location_detail, price: node.price, beds: node.beds, baths: node.baths,
        surface_area: { built: node.surface_area?.built || '0' },
        pool: node.pool, new_build: node.new_build, url: node.url,
        name: node.name, development_name: node.development_name, residence: node.residence,
        images: { image: images.map(url => ({ url })) },
        features: node.features,
        desc: { en: (node.desc?.en || node.desc?.es || '').split('. ').slice(0, 2).join('. ') + '.' }
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ root: { property: lightweight } });
  } catch (err) {
    res.statusCode = 500;
    res.end(`Feed proxy error: ${err.message}`);
  }
}
