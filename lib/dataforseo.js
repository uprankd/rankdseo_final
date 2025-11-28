import axios from 'axios';
import base64 from 'base-64';

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.warn('DataForSEO credentials not configured');
}

// Create base64 encoded credentials
const credentials = base64.encode(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

// Create axios instance with authentication
const dataForSEOClient = axios.create({
  baseURL: 'https://api.dataforseo.com/v3',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Helper function to handle API errors and rate limiting
 */
async function makeRequest(endpoint, data, retries = 3) {
  try {
    const response = await dataForSEOClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429 && retries > 0) {
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(endpoint, data, retries - 1);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your DataForSEO credentials.');
    }
    
    // Handle other errors
    throw error;
  }
}

// Simple in-memory cache
const cache: {
  data: Record<string, { value: any; expiry: number }>;
  get: (key: string) => any;
  set: (key: string, value: any, ttlMinutes?: number) => void;
} = {
  data: {},
  get(key: string) {
    const item = this.data[key];
    if (!item) return null;
    
    // Check if cache is expired (30 minutes)
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    
    return item.value;
  },
  set(key: string, value: any, ttlMinutes = 30) {
    this.data[key] = {
      value,
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
  }
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.replace('www.', '');
  }
}

/**
 * Get domain metrics including DA, DR, referring domains, backlinks
 * @param {string} url - URL or domain to analyze (e.g., example.com or https://example.com)
 * @returns {Promise} - Domain metrics data
 */
export async function getDomainMetrics(url: string) {
  const domain = extractDomain(url);
  const cacheKey = `domain_metrics_${domain}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`Using cached data for ${domain}`);
    return cachedData;
  }
  
  try {
    console.log(`Fetching metrics for domain: ${domain}`);
    
    // Get backlinks overview (includes referring domains and backlinks count)
    const backlinksResponse = await makeRequest(
      '/backlinks/summary/live',
      [{ target: domain, internal_list_limit: 1 }]
    );
    
    const backlinksData = backlinksResponse.tasks?.[0]?.result?.[0] || {};
    
    console.log('Backlinks data received:', backlinksData);
    
    // Extract metrics with fallbacks
    const metrics = {
      domain,
      domainAuthority: Math.round(backlinksData.rank || 0), // Use rank as DA approximation
      domainRating: Math.round(backlinksData.rank || 0), // Use rank as DR approximation
      referringDomains: backlinksData.referring_domains || 0,
      totalBacklinks: backlinksData.backlinks || 0,
      trustFlow: Math.round((backlinksData.rank || 0) * 0.9), // Approximate TF
      citationFlow: Math.round((backlinksData.rank || 0) * 0.95), // Approximate CF
      trafficValue: backlinksData.domain_trust || 0,
    };
    
    console.log('Processed metrics:', metrics);
    
    // Cache the result
    cache.set(cacheKey, metrics);
    
    return metrics;
  } catch (error: any) {
    console.error('Error fetching domain metrics:', error.response?.data || error.message);
    throw new Error(error.response?.data?.status_message || 'Failed to fetch domain metrics');
  }
}

export default {
  getDomainMetrics,
};
