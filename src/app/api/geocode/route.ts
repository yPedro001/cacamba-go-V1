import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const query = encodeURIComponent(q);
  const debug: any[] = [];

  // MUDANÇA: Priorizar PHOTON agora, pois Nominatim está dando 429
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${query}&limit=10`;
    debug.push(`Calling Photon: ${photonUrl}`);
    const res = await fetch(photonUrl);
    
    if (res.ok) {
      const photonData = await res.json();
      const features = photonData.features || [];
      const compatibleData = features.map((f: any) => ({
        lat: f.geometry.coordinates[1].toString(),
        lon: f.geometry.coordinates[0].toString(),
        display_name: [
          f.properties.name,
          f.properties.housenumber,
          f.properties.street,
          f.properties.city,
          f.properties.state
        ].filter(Boolean).join(', '),
        address: {
          road: f.properties.street,
          city: f.properties.city,
          postcode: f.properties.postcode
        }
      }));

      if (compatibleData.length > 0) return NextResponse.json(compatibleData);
      debug.push("Photon returned 0 features");
    } else {
      debug.push(`Photon failed with status ${res.status}`);
    }
  } catch (e: any) {
    debug.push(`Photon Exception: ${e.message}`);
  }

  // TENTATIVA NOMINATIM como Fallback Secundário
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=br&addressdetails=1`;
    debug.push(`Calling Nominatim: ${nominatimUrl}`);
    const res = await fetch(nominatimUrl, { 
      headers: { 'User-Agent': 'CacambaGo-Debug/1.0' }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return NextResponse.json(data);
    }
    debug.push(`Nominatim failed with status ${res.status}`);
  } catch (e: any) {
    debug.push(`Nominatim Exception: ${e.message}`);
  }

  // Retorna o log de erro se nada funcionar
  return NextResponse.json({ error: "All providers failed", debug }, { status: 500 });
}
