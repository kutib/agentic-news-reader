import { ArticleMeta } from '../types';
import { searchNews as searchNewsAPI } from './newsapi';
import { searchGNews, GNewsResult } from './gnews';

interface SearchParams {
  query: string;
  from?: string;
  to?: string;
  pageSize?: number;
  sortBy?: 'publishedAt' | 'relevancy' | 'popularity';
}

export interface NewsSearchResult {
  articles: ArticleMeta[];
  requestUrl?: string; // URL for debugging (only for GNews)
}

type NewsProvider = 'newsapi' | 'gnews' | 'auto';

// Get the configured provider, defaulting to 'auto'
function getProvider(): NewsProvider {
  const envProvider = process.env.NEWS_PROVIDER?.toLowerCase();
  if (envProvider === 'newsapi' || envProvider === 'gnews') {
    return envProvider;
  }
  return 'auto';
}

// Check if we're running on localhost
function isLocalhost(): boolean {
  // In development mode
  if (process.env.NODE_ENV === 'development') return true;
  // Vercel sets this in production
  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.VERCEL_ENV === 'preview') return false;
  return true;
}

/**
 * Search for news articles using the configured provider.
 * In 'auto' mode:
 * - Uses NewsAPI on localhost (free tier works locally)
 * - Uses GNews in production (free tier works everywhere)
 */
export async function searchNews(params: SearchParams): Promise<NewsSearchResult> {
  const provider = getProvider();

  // Determine which provider to use
  let useNewsAPI = false;

  if (provider === 'newsapi') {
    useNewsAPI = true;
  } else if (provider === 'gnews') {
    useNewsAPI = false;
  } else {
    // Auto mode: use NewsAPI locally, GNews in production
    useNewsAPI = isLocalhost() && !!process.env.NEWS_API_KEY;
  }

  // Check API key availability
  if (useNewsAPI) {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY is not configured');
    }
    console.log('[News] Using NewsAPI');
    const articles = await searchNewsAPI(params);
    return { articles };
  } else {
    if (!process.env.GNEWS_API_KEY) {
      // Fall back to NewsAPI if GNews key is not set but NewsAPI is
      if (process.env.NEWS_API_KEY && isLocalhost()) {
        console.log('[News] GNEWS_API_KEY not set, falling back to NewsAPI (localhost only)');
        const articles = await searchNewsAPI(params);
        return { articles };
      }
      throw new Error('GNEWS_API_KEY is not configured. Get a free key at https://gnews.io/');
    }
    console.log('[News] Using GNews');
    const result = await searchGNews(params);
    return {
      articles: result.articles,
      requestUrl: result.requestUrl,
    };
  }
}
