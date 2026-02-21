import { ArticleMeta } from '../types';

const GUARDIAN_API_BASE_URL = 'https://content.guardianapis.com/search';

interface GuardianArticle {
  id: string;
  type: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  isHosted: boolean;
  pillarId?: string;
  pillarName?: string;
}

interface GuardianResponse {
  response: {
    status: string;
    userTier: string;
    total: number;
    startIndex: number;
    pageSize: number;
    currentPage: number;
    pages: number;
    orderBy: string;
    results: GuardianArticle[];
  };
}

interface SearchParams {
  query: string;
  from?: string;
  to?: string;
  pageSize?: number;
}

export interface GuardianResult {
  articles: ArticleMeta[];
  requestUrl: string;
}

export async function searchGuardian(params: SearchParams): Promise<GuardianResult> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    throw new Error('GUARDIAN_API_KEY is not configured. Get a free key at https://open-platform.theguardian.com/');
  }

  const url = new URL(GUARDIAN_API_BASE_URL);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('q', params.query);
  url.searchParams.set('order-by', 'newest');

  // Guardian uses 'page-size', max 50 on free tier
  const pageSize = Math.min(params.pageSize || 20, 50);
  url.searchParams.set('page-size', String(pageSize));

  // Date filters (format: YYYY-MM-DD)
  if (params.from) {
    url.searchParams.set('from-date', params.from.split('T')[0]);
  }
  if (params.to) {
    url.searchParams.set('to-date', params.to.split('T')[0]);
  }

  // Create display URL (with key for debugging - POC)
  const displayUrl = url.toString();

  console.log(`[Guardian] Request URL: ${displayUrl}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AgenticNewsReader/1.0',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Guardian API error ${response.status}: ${errorBody}`);
    }

    const data: GuardianResponse = await response.json();

    if (data.response.status !== 'ok') {
      throw new Error(`Guardian API returned status: ${data.response.status}`);
    }

    console.log(`[Guardian] Query: "${params.query}" returned ${data.response.total} total, ${data.response.results?.length || 0} articles`);

    if (!data.response.results || data.response.results.length === 0) {
      console.log('[Guardian] No articles returned');
      return {
        articles: [],
        requestUrl: displayUrl,
      };
    }

    // Normalize response to ArticleMeta
    const articles: ArticleMeta[] = data.response.results.map((article) => ({
      title: article.webTitle || 'Untitled',
      url: article.webUrl,
      source: `The Guardian - ${article.sectionName}`,
      publishedAt: article.webPublicationDate,
      description: null, // Guardian API doesn't include description in basic search
    }));

    return {
      articles,
      requestUrl: displayUrl,
    };
  } catch (error) {
    console.error('[Guardian] Request failed:', error);
    throw error;
  }
}
