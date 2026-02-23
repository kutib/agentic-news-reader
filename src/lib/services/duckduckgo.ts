import { ArticleMeta } from '../types';
import { search, SafeSearchType } from 'duck-duck-scrape';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface SearchParams {
    query: string;
    from?: string;
    to?: string;
    pageSize?: number;
    sortBy?: 'publishedAt' | 'relevancy' | 'popularity';
}

export interface DuckDuckGoResult {
    articles: ArticleMeta[];
    requestUrl: string;
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for news articles using DuckDuckGo via duck-duck-scrape.
 * No API key required — this scrapes DuckDuckGo's search results.
 */
export async function searchDuckDuckGo(params: SearchParams): Promise<DuckDuckGoResult> {
    const pageSize = params.pageSize || 20;
    const displayUrl = `https://duckduckgo.com/?q=${encodeURIComponent(params.query)}&ia=news`;

    console.log(`[DuckDuckGo] Searching: "${params.query}" (pageSize: ${pageSize})`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const results = await search(params.query, {
                safeSearch: SafeSearchType.OFF,
            });

            if (!results.results || results.results.length === 0) {
                console.log('[DuckDuckGo] No results returned');
                return {
                    articles: [],
                    requestUrl: displayUrl,
                };
            }

            console.log(`[DuckDuckGo] Query: "${params.query}" returned ${results.results.length} results`);

            // Normalize results to ArticleMeta, limit to pageSize
            const articles: ArticleMeta[] = results.results
                .slice(0, pageSize)
                .map((result) => ({
                    title: result.title || 'Untitled',
                    url: result.url,
                    source: result.hostname || new URL(result.url).hostname || 'Unknown',
                    publishedAt: new Date().toISOString(), // DDG text search doesn't provide dates
                    description: result.description || null,
                }));

            return {
                articles,
                requestUrl: displayUrl,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[DuckDuckGo] Request failed (attempt ${attempt + 1}):`, lastError.message);

            if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_DELAY_MS * (attempt + 1));
            }
        }
    }

    throw lastError || new Error('DuckDuckGo request failed after retries');
}
