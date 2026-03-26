export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    postcode?: string;
    house_number?: string;
  };
}

export async function fetchAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (data.erro) return null;

    // Tentar buscar coordenadas via proxy interno
    let lat: number | undefined;
    let lng: number | undefined;

    try {
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(`${data.logradouro}, ${data.localidade}, Brasil`)}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData[0]) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }
    } catch (e) {
      console.warn('Could not fetch coordinates for CEP address');
    }

    return {
      rua: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      cep: data.cep,
      lat,
      lng
    };
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
}

export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 3) return [];

  try {
    const res = await fetch(`/api/geocode?type=nominatim&q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
