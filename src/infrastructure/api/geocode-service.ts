/**
 * Infrastructure Layer: External API Services
 * Handles Geocoding and ZIP code lookup
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    postcode?: string;
  };
}

export interface CepResult {
  rua: string;
  bairro: string;
  cidade: string;
  cep: string;
  lat?: number;
  lng?: number;
}

export interface ReverseCepResult {
  cep: string;
  confidence: number; // 0-1, indica confiança do resultado
}

const NOMINATIM_BASE_URL = '/api/geocode'; // Proxy local

export const geocodeService = {
  /**
   * Fetches address details starting from a CEP (ZIP Code)
   */
  async fetchByCep(cep: string): Promise<CepResult | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) return null;

      // Try to get coordinates via our internal proxy
      let coords: { lat?: number; lng?: number } = {};
      try {
        const geoRes = await fetch(`${NOMINATIM_BASE_URL}?q=${encodeURIComponent(`${data.logradouro}, ${data.localidade}, Brasil`)}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.[0]) {
            coords = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
          }
        }
      } catch (e) {
        console.warn('Geocoding coordinates failed for CEP, but continuing with address data.');
      }

      return {
        rua: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        cep: data.cep,
        ...coords
      };
    } catch (error) {
      console.error('[GeocodeService] Error in fetchByCep:', error);
      return null;
    }
  },

/**
    * Fetches address suggestions based on a text query
    */
  async fetchSuggestions(query: string): Promise<GeocodeResult[]> {
    if (query.length < 3) return [];

    try {
      const res = await fetch(`${NOMINATIM_BASE_URL}?type=nominatim&q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address || {}
      }));
    } catch (error) {
      console.error('[GeocodeService] Error in fetchSuggestions:', error);
      return [];
    }
  },

  /**
  /**
    * Reverse geocodes: finds CEP from address (rua, cidade, uf) via internal /api/geocode proxy
    * Returns null if no CEP found or low confidence
    */
  async fetchCepByAddress(rua: string, cidade: string, uf: string): Promise<ReverseCepResult | null> {
    if (!rua || !cidade || !uf) return null;
    if (rua.length < 3 || cidade.length < 3) return null;

    try {
      const query = `${rua}, ${cidade}, ${uf}, Brasil`;
      const res = await fetch(`${NOMINATIM_BASE_URL}?type=nominatim&q=${encodeURIComponent(query)}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const address = data[0]?.address || {};
      const cep = String(address.postcode || '').replace(/\D/g, '');
      if (cep.length !== 8) {
        return null;
      }

      return {
        cep,
        confidence: address.postcode ? 0.9 : 0.5,
      };
    } catch (error) {
      console.error('[GeocodeService] Error in fetchCepByAddress:', error);
      return null;
    }
  }
};
