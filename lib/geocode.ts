import { BUSINESSES } from './data';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'SanLorenzoDigital/1.0';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  timestamp: number;
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  type?: string;
  class?: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

const cache = new Map<string, GeoResult>();

/**
 * Normaliza una calle para poder comparar variantes como:
 * "Sgto. Cabral" / "Sargento Cabral".
 */
function normalizeStreet(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bsgto\b/g, 'sargento')
    .replace(/\bsarg\b/g, 'sargento')
    .replace(/\bbv\b/g, 'boulevard')
    .replace(/\bav\b/g, 'avenida')
    .replace(/\bavda\b/g, 'avenida')
    .replace(/\bpte\b/g, 'presidente')
    .replace(/\bdr\b/g, 'doctor')
    .replace(/\bgral\b/g, 'general')
    .replace(/\bgral\.\b/g, 'general')
    .trim();
}

/**
 * Extrae el número de puerta de una dirección.
 */
function extractHouseNumber(address: string): string | null {
  const match = address.match(/\b(\d{1,5})\b/);
  return match ? match[1] : null;
}

/**
 * Extrae la parte de calle de una dirección.
 */
function extractStreet(address: string): string {
  const withoutNumber = address.replace(/\b\d{1,5}\b/, ' ');
  return normalizeStreet(withoutNumber);
}

/**
 * Comprueba que un resultado pertenece realmente a San Lorenzo,
 * Santa Fe, Argentina.
 */
function isSanLorenzoSantaFe(result: NominatimResult): boolean {
  const address = result.address || {};

  const city = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const state = (address.state || '').toLowerCase();
  const country = (address.country || '').toLowerCase();

  return (
    city.includes('san lorenzo') &&
    state.includes('santa fe') &&
    country.includes('argentina')
  );
}

/**
 * Calcula qué tan bien coincide un resultado con la dirección buscada.
 */
function scoreResult(
  result: NominatimResult,
  requestedAddress: string
): number {
  const address = result.address || {};

  const requestedStreet = extractStreet(requestedAddress);
  const requestedNumber = extractHouseNumber(requestedAddress);

  const resultStreet = normalizeStreet(address.road || '');
  const resultNumber = address.house_number || '';

  let score = 0;

  // Debe pertenecer a San Lorenzo, Santa Fe, Argentina.
  if (!isSanLorenzoSantaFe(result)) {
    return -100;
  }

  // Calle exacta o muy parecida.
  if (requestedStreet && resultStreet) {
    if (resultStreet === requestedStreet) {
      score += 60;
    } else if (
      resultStreet.includes(requestedStreet) ||
      requestedStreet.includes(resultStreet)
    ) {
      score += 35;
    }
  }

  // Número exacto: esto es lo más importante.
  if (requestedNumber && resultNumber) {
    if (resultNumber === requestedNumber) {
      score += 80;
    } else {
      score -= 50;
    }
  }

  // Favorecer resultados de dirección, no POI genéricos.
  if (result.type === 'house') {
    score += 20;
  }

  if (result.class === 'place') {
    score -= 10;
  }

  return score;
}

/**
 * Geocodifica una dirección usando Nominatim.
 *
 * Esta función genérica devuelve el primer resultado válido.
 * Para negocios se utiliza geocodeBusinessAddress(), que aplica
 * validación adicional.
 */
export async function geocode(address: string): Promise<GeoResult | null> {
  const cached = cache.get(address);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      format: 'jsonv2',
      limit: '1',
      addressdetails: '1',
      countrycodes: 'ar',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return null;
    }

    const data: NominatimResult[] = await response.json();

    if (!data || !data.length || !data[0].lat || !data[0].lon) {
      return null;
    }

    const result: GeoResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name || '',
      timestamp: Date.now(),
    };

    if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) {
      return null;
    }

    cache.set(address, result);

    return result;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

/**
 * Geocodifica una dirección de negocio en San Lorenzo.
 *
 * IMPORTANTE:
 * No acepta automáticamente el primer resultado.
 * Busca varios resultados y compara:
 * - localidad
 * - provincia
 * - país
 * - calle
 * - número
 *
 * Si no existe una coincidencia suficientemente confiable,
 * devuelve null.
 */
export async function geocodeBusinessAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const cleanAddress = address.trim();

  if (!cleanAddress) {
    return null;
  }

  const query = cleanAddress.toLowerCase().includes('san lorenzo')
    ? cleanAddress
    : `${cleanAddress}, San Lorenzo, Santa Fe, Argentina`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '8',
      addressdetails: '1',
      countrycodes: 'ar',

      // Caja aproximada alrededor de San Lorenzo.
      // Formato: left,top,right,bottom
      viewbox: '-60.78,-32.70,-60.69,-32.80',
      bounded: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Nominatim business error:', response.status);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('No se encontraron resultados para:', query);
      return null;
    }

    const scored = results
      .map((result) => ({
        result,
        score: scoreResult(result, cleanAddress),
      }))
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      console.warn(
        'No hubo una coincidencia suficientemente confiable para:',
        query
      );
      return null;
    }

    const best = scored[0];

    if (!best.result.lat || !best.result.lon) {
      return null;
    }

    const lat = parseFloat(best.result.lat);
    const lng = parseFloat(best.result.lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    console.log('📍 Geocodificación aceptada:', {
      query,
      score: best.score,
      displayName: best.result.display_name,
      lat,
      lng,
    });

    return { lat, lng };
  } catch (error) {
    console.error('Business geocoding failed:', error);
    return null;
  }
}

/**
 * Obtiene coordenadas de un negocio, usando cache si ya fueron geocodificadas.
 */
export async function getBusinessCoordinates(businessId: string) {
  const business = BUSINESSES.find((b: any) => b.id === businessId);

  if (!business) {
    return null;
  }

  if (
    business.latitude &&
    business.longitude &&
    business.location_verified
  ) {
    return {
      lat: business.latitude,
      lng: business.longitude,
    };
  }

  if (business.latitude && business.longitude) {
    return {
      lat: business.latitude,
      lng: business.longitude,
    };
  }

  if (business.address) {
    const fullAddress = `${business.address}, ${
      business.city || ''
    }, ${business.province || ''}, ${
      business.country || 'Argentina'
    }`;

    return await geocode(fullAddress);
  }

  return null;
}

/**
 * Rate limiter simple para respetar políticas de Nominatim (1 req/seg).
 */
let lastRequestTime = 0;

export async function rateLimitedGeocode(
  address: string
): Promise<GeoResult | null> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  return await geocode(address);
}
