import { ArticleMeta } from '../types';

const CURRENTS_API_BASE_URL = 'https://api.currentsapi.services/v1/search';

interface CurrentsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  image: string | null;
  language: string;
  category: string[];
  published: string;
}

interface CurrentsResponse {
  status: string;
  news: CurrentsArticle[];
}

interface SearchParams {
  query: string;
  pageSize?: number;
}

export interface CurrentsResult {
  articles: ArticleMeta[];
  requestUrl: string;
}

export async function searchCurrents(params: SearchParams): Promise<CurrentsResult> {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey) {
    throw new Error('CURRENTS_API_KEY is not configured. Get a free key at https://currentsapi.services/');
  }

  const url = new URL(CURRENTS_API_BASE_URL);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('keywords', params.query);
  url.searchParams.set('language', 'en');

  // Currents uses 'page_size', default 10
  if (params.pageSize) {
    url.searchParams.set('page_size', String(params.pageSize));
  }

  // Create display URL (with key for debugging - POC)
  const displayUrl = url.toString();

  console.log(`[Currents] Request URL: ${displayUrl}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AgenticNewsReader/1.0',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Currents API error ${response.status}: ${errorBody}`);
    }

    const data: CurrentsResponse = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`Currents API returned status: ${data.status}`);
    }

    console.log(`[Currents] Query: "${params.query}" returned ${data.news?.length || 0} articles`);

    if (!data.news || data.news.length === 0) {
      console.log('[Currents] No articles returned');
      return {
        articles: [],
        requestUrl: displayUrl,
      };
    }

    // Normalize response to ArticleMeta
    const articles: ArticleMeta[] = data.news.map((article) => ({
      title: article.title || 'Untitled',
      url: article.url,
      source: article.author || 'Unknown',
      publishedAt: article.published,
      description: article.description,
    }));

    return {
      articles,
      requestUrl: displayUrl,
    };
  } catch (error) {
    console.error('[Currents] Request failed:', error);
    throw error;
  }
}
