import fetch from 'node-fetch'; // if missing, ill install it

async function test() {
  try {
    const r = await fetch('https://www.lozanorealty.uk/api/feed');
    const ct = r.headers.get('content-type');
    console.log('content type:', ct);
    const data = await r.json();
    console.log('Keys:', Object.keys(data));
    console.log('Root:', Object.keys(data.root || {}));
    console.log('First prop:', JSON.stringify(data.root.property[0]).slice(0, 300));
  } catch (e) {
    console.error(e);
  }
}
test();
