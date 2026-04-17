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
   * Reverses geocoding: finds CEP from address (rua, cidade, uf)
   * Returns null if no CEP found or low confidence
   */
  async fetchCepByAddress(rua: string, cidade: string, uf: string): Promise<ReverseCepResult | null> {
    if (!rua || !cidade || !uf) return null;
    
    // Need minimum address info to search
    if (rua.length < 3 || cidade.length < 3) return null;

    try {
      // Build search query: "rua, cidade, UF, Brasil"
      const query = `${rua}, ${cidade}, ${uf}, Brasil`;
      
      // Use Nominatim for reverse geocoding
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
      
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'CacambaGo/1.0'
        }
      });
      
      if (!res.ok) return null;
      
      const data = await res.json();
      if (!data || data.length === 0) return null;
      
      const result = data[0];
      const address = result.address || {};
      
      // Extract CEP from different possible fields
      let cep = address.postcode || '';
      
      // Clean CEP (remove spaces, dashes)
      cep = cep.replace(/\D/g, '');
      
      // Validate if we got a valid 8-digit CEP
      if (cep.length !== 8) {
        console.warn('[GeocodeService] CEP not found in reverse geocoding result');
        return null;
      }
      
      // Calculate confidence based on match quality
      // If the returned address has a postcode, confidence is high
      const confidence = address.postcode ? 0.9 : 0.5;
      
      return {
        cep: cep,
        confidence
      };
    } catch (error) {
      console.error('[GeocodeService] Error in fetchCepByAddress:', error);
      return null;
    }
  }
};
