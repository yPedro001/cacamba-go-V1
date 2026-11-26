import { NextResponse } from 'next/server';

const REQUEST_TIMEOUT_MS = 5000;
const MAX_QUERY_LEN = 200;

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().slice(0, MAX_QUERY_LEN);

  if (query.length < 3) {
    return NextResponse.json(
      { error: 'Informe ao menos 3 caracteres para buscar o endereço.' },
      { status: 400 }
    );
  }

  // Tentativa 1: Photon Komoot (rápido e tolerante para autocomplete, com bbox aproximada do Brasil)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&bbox=-74,-34,-34,5`;
    const photonRes = await fetchWithTimeout(photonUrl, {
      headers: { Accept: 'application/json' },
    });

    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (Array.isArray(photonData?.features) && photonData.features.length > 0) {
        const formatted = photonData.features.map((f: any) => {
          const p = f.properties || {};
          const [lng, lat] = f.geometry?.coordinates || [0, 0];
          const roadParts = [p.name || p.street, p.housenumber].filter(Boolean).join(', ');
          const city = p.city || p.town || p.village || p.state || '';
          const display_name = [roadParts, p.district, city, p.postcode].filter(Boolean).join(', ');

          return {
            display_name: display_name || p.name || query,
            lat: String(lat),
            lon: String(lng),
            address: {
              road: p.street || p.name || '',
              suburb: p.district || p.suburb || '',
              city: p.city || p.town || p.village || '',
              postcode: p.postcode || '',
              house_number: p.housenumber || '',
            },
          };
        });
        return NextResponse.json(formatted);
      }
    }
  } catch {
    // Segue para fallback Nominatim
  }

  // Tentativa 2: Nominatim OpenStreetMap (restrito ao Brasil)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=br&addressdetails=1&limit=5`;

    const res = await fetchWithTimeout(nominatimUrl, {
      headers: {
        'User-Agent': 'CacambaGo/1.0 (+https://cg.lyvox.com.br)',
        Accept: 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(Array.isArray(data) ? data : []);
    }
  } catch {
    // Sem resultados disponíveis no momento
  }

  // Nunca devolve 500 + debug stack para falha externa transitória ou endereço não encontrado
  return NextResponse.json([]);
}
