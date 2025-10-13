'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  sentiment?: string;
}

export function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketNews = async () => {
      try {
        // Fetch general market news using trending endpoint
        const response = await fetch('/api/market/news/trending');

        if (!response.ok) {
          throw new Error('Failed to fetch market news');
        }

        const data = await response.json();

        // Transform the data to our format (API returns array directly)
        const newsArray = Array.isArray(data) ? data : (data.news || []);
        const newsItems: NewsItem[] = newsArray.map((item: any) => ({
          title: item.title,
          description: item.description || item.text || item.summary || '',
          source: item.source || item.source_name || 'Market News',
          url: item.url || item.news_url || '#',
          publishedAt: item.timestamp || item.date || new Date().toISOString(),
          imageUrl: item.imageUrl || item.image_url,
          sentiment: item.sentiment
        }));

        setNews(newsItems.slice(0, 10)); // Limit to 10 news items
      } catch (err) {
        console.error('Error fetching market news:', err);
        setError('Failed to load market news');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketNews, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-manrope font-semibold mb-4">Market News</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-manrope font-semibold mb-4">Market News</h2>
        <div className="text-center py-8 text-gray-500 text-sm">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Unable to load market news at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-manrope font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          Market News
        </h2>
      </div>

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto thin-scrollbar">
        {news.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex gap-3">
              {item.imageUrl && (
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-inter text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium">{item.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                  </span>
                  {item.sentiment && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                      item.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.sentiment}
                    </span>
                  )}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}