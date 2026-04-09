import axios from 'axios';
import logger from './logger.js';

const DEFAULT_BIRTH_PLACE = {
  city: 'Colombo',
  country: 'Sri Lanka',
  latitude: 6.9271,
  longitude: 79.8612,
  timezone: 'Asia/Colombo',
};

const SRI_LANKA_LOCATION_FALLBACKS = {
  Ampara: { latitude: 7.2917, longitude: 81.6724 },
  Anuradhapura: { latitude: 8.3114, longitude: 80.4037 },
  Badulla: { latitude: 6.9895, longitude: 81.055 },
  Batticaloa: { latitude: 7.7102, longitude: 81.6924 },
  Colombo: { latitude: 6.9271, longitude: 79.8612 },
  Galle: { latitude: 6.0535, longitude: 80.221 },
  Gampaha: { latitude: 7.084, longitude: 80.0098 },
  Hambantota: { latitude: 6.1241, longitude: 81.1185 },
  Jaffna: { latitude: 9.6615, longitude: 80.0255 },
  Kalutara: { latitude: 6.5854, longitude: 79.9607 },
  Kandy: { latitude: 7.2906, longitude: 80.6337 },
  Kegalle: { latitude: 7.2513, longitude: 80.3464 },
  Kilinochchi: { latitude: 9.3803, longitude: 80.376 },
  Kurunegala: { latitude: 7.4863, longitude: 80.3647 },
  Mannar: { latitude: 8.9806, longitude: 79.9042 },
  Matale: { latitude: 7.4675, longitude: 80.6234 },
  Matara: { latitude: 5.9549, longitude: 80.555 },
  Monaragala: { latitude: 6.8728, longitude: 81.3507 },
  Mullaitivu: { latitude: 9.2671, longitude: 80.8142 },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
  Polonnaruwa: { latitude: 7.9403, longitude: 81.0188 },
  Puttalam: { latitude: 8.0362, longitude: 79.8283 },
  Ratnapura: { latitude: 6.6828, longitude: 80.3992 },
  Trincomalee: { latitude: 8.5874, longitude: 81.2152 },
  Vavuniya: { latitude: 8.7514, longitude: 80.4971 },
};

const geocodeCache = new Map();
const suggestionCache = new Map();

function normalizePlaceName(value = '') {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildBirthPlace(city, coords) {
  return {
    city,
    country: 'Sri Lanka',
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
    timezone: 'Asia/Colombo',
  };
}

function findFallbackLocation(value = '') {
  const normalized = normalizePlaceName(value);
  if (!normalized) {
    return { ...DEFAULT_BIRTH_PLACE };
  }

  const exactMatch = Object.entries(SRI_LANKA_LOCATION_FALLBACKS).find(
    ([city]) => normalizePlaceName(city) === normalized
  );

  if (exactMatch) {
    return buildBirthPlace(exactMatch[0], exactMatch[1]);
  }

  const partialMatch = Object.entries(SRI_LANKA_LOCATION_FALLBACKS).find(([city]) => {
    const normalizedCity = normalizePlaceName(city);
    return normalized.includes(normalizedCity) || normalizedCity.includes(normalized);
  });

  if (partialMatch) {
    return buildBirthPlace(partialMatch[0], partialMatch[1]);
  }

  return null;
}

function pickReadablePlaceName(rawValue, address = {}) {
  return [
    address.city,
    address.town,
    address.village,
    address.hamlet,
    address.suburb,
    address.county,
    rawValue,
  ].find(Boolean) || DEFAULT_BIRTH_PLACE.city;
}

function buildFallbackSuggestions(query = '', limit = 5) {
  const normalized = normalizePlaceName(query);
  const prefixMatches = COMMON_SRI_LANKAN_LOCATIONS.filter((place) => normalizePlaceName(place).startsWith(normalized));
  const partialMatches = COMMON_SRI_LANKAN_LOCATIONS.filter((place) => normalizePlaceName(place).includes(normalized));
  return [...new Set([...prefixMatches, ...partialMatches])].slice(0, limit);
}

function buildSuggestionLabel(match = {}) {
  const primary = pickReadablePlaceName('', match.address || {});
  const secondary = [
    match.address?.state_district,
    match.address?.county,
    match.address?.state,
  ].find(Boolean);

  return [primary, secondary]
    .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
    .join(', ');
}

export async function suggestBirthPlaces(query = '', limit = 5) {
  const requested = String(query).trim();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 5));
  const cacheKey = `${normalizePlaceName(requested)}:${safeLimit}`;

  if (!requested) {
    return COMMON_SRI_LANKAN_LOCATIONS.slice(0, safeLimit);
  }

  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey);
  }

  let suggestions = [];

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${requested}, Sri Lanka`,
        format: 'jsonv2',
        limit: safeLimit,
        addressdetails: 1,
        countrycodes: 'lk',
      },
      headers: {
        'User-Agent': 'RaashiLink.AI/1.0 (birth-place-suggestions)',
      },
      timeout: 5000,
    });

    suggestions = (Array.isArray(response.data) ? response.data : [])
      .map((match) => buildSuggestionLabel(match))
      .filter(Boolean);
  } catch (error) {
    logger.warn('Birth place suggestion lookup failed, using local suggestions', {
      query: requested,
      message: error.message,
    });
  }

  if (!suggestions.length) {
    suggestions = buildFallbackSuggestions(requested, safeLimit);
  }

  const uniqueSuggestions = [...new Set(suggestions)].slice(0, safeLimit);
  suggestionCache.set(cacheKey, uniqueSuggestions);
  return uniqueSuggestions;
}

export async function resolveBirthPlace(value = '') {
  const requested = String(value).trim();
  const cacheKey = normalizePlaceName(requested);

  if (!requested) {
    return { ...DEFAULT_BIRTH_PLACE };
  }

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const fallback = findFallbackLocation(requested);
  if (fallback && normalizePlaceName(fallback.city) === cacheKey) {
    geocodeCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${requested}, Sri Lanka`,
        format: 'jsonv2',
        limit: 1,
        addressdetails: 1,
        countrycodes: 'lk',
      },
      headers: {
        'User-Agent': 'RaashiLink.AI/1.0 (birth-location-resolver)',
      },
      timeout: 5000,
    });

    const match = Array.isArray(response.data) ? response.data[0] : null;
    if (match?.lat && match?.lon) {
      const resolved = {
        city: pickReadablePlaceName(requested, match.address),
        country: 'Sri Lanka',
        latitude: Number(match.lat),
        longitude: Number(match.lon),
        timezone: 'Asia/Colombo',
      };

      geocodeCache.set(cacheKey, resolved);
      return resolved;
    }
  } catch (error) {
    logger.warn('Birth place geocoding failed, using fallback coordinates', {
      place: requested,
      message: error.message,
    });
  }

  const resolved = fallback || {
    ...DEFAULT_BIRTH_PLACE,
    city: requested,
  };

  geocodeCache.set(cacheKey, resolved);
  return resolved;
}

export const COMMON_SRI_LANKAN_LOCATIONS = Object.keys(SRI_LANKA_LOCATION_FALLBACKS);
