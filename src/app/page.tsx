'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, Filter, Search, ImageIcon, LinkIcon, FileText } from 'lucide-react';
import { Post, PostType } from '@/components/feed/Post';
import { UserProfileCard } from '@/components/feed/UserProfileCard';
import { ALL_SYMBOLS } from '@/data/symbol-database';

// Sample posts for demonstration
const SAMPLE_POSTS = [
  {
    id: '1',
    author: {
      username: 'traderjoe',
      name: 'Joe Smith',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joe'
    },
    community: 'AAPL',
    type: 'chart' as PostType,
    title: 'Apple breaking out of consolidation pattern! 🚀',
    content: 'Been watching this setup for weeks. Clear breakout above $195 resistance with strong volume. Target is $210 based on the pattern height. Stop loss at $192.',
    chartSymbol: 'AAPL',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: 45,
    comments: 12,
    isLiked: false
  },
  {
    id: '2',
    author: {
      username: 'marketwatcher',
      name: 'Sarah Chen',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
    },
    community: 'NVDA',
    type: 'text' as PostType,
    title: 'NVIDIA earnings play strategy',
    content: 'With earnings coming up next week, IV is through the roof. Selling covered calls here makes a lot of sense. The premium on the $900 strikes expiring Friday is juicy. Even if we get called away, that\'s a solid 5% gain in a week. Risk management is key - only playing with 25% of my NVDA position.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    likes: 89,
    comments: 34,
    isLiked: true
  },
  {
    id: '3',
    author: {
      username: 'techbull2024',
      name: 'Michael Rodriguez',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael'
    },
    community: 'General',
    type: 'link' as PostType,
    title: 'Fed Minutes Released - Dovish Tone Continues',
    content: 'The latest Fed minutes suggest rate cuts might come sooner than expected. This could be huge for growth stocks.',
    linkUrl: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes.htm',
    linkPreview: {
      title: 'FOMC Minutes: December 2024 Meeting',
      description: 'Minutes of the Federal Open Market Committee meeting held on December 17-18, 2024',
      image: 'https://www.federalreserve.gov/images/frs-seal.png',
      domain: 'federalreserve.gov'
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: 156,
    comments: 67,
    isLiked: false
  },
  {
    id: '4',
    author: {
      username: 'optionstrader',
      name: 'Alex Kim',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
    },
    community: 'SPY',
    type: 'image' as PostType,
    title: 'SPY Iron Condor Setup - 45 DTE',
    content: 'Setting up an iron condor on SPY with 45 days to expiration. Selling the 440/445 put spread and 475/480 call spread. Collecting $180 in premium with max loss of $320. Probability of profit is 68%. Will manage at 21 DTE or 50% profit, whichever comes first.',
    imageUrl: 'https://www.optionsprofitcalculator.com/img/og-image.png',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 234,
    comments: 89,
    isLiked: false
  },
  {
    id: '5',
    author: {
      username: 'dividendinvestor',
      name: 'Emily Thompson',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily'
    },
    community: 'JNJ',
    type: 'text' as PostType,
    title: 'Why JNJ is a dividend aristocrat worth holding forever',
    content: 'Johnson & Johnson has increased its dividend for 61 consecutive years! Current yield is 3.1% and payout ratio is only 45%, leaving plenty of room for future increases. The company\'s diverse healthcare portfolio provides incredible stability. This is a core holding in my retirement portfolio - I\'m never selling, just collecting those sweet quarterly payments and reinvesting. Dollar cost averaging $500 monthly.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 78,
    comments: 23,
    isLiked: true
  },
  {
    id: '6',
    author: {
      username: 'cryptotrader',
      name: 'David Park',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
    },
    community: 'COIN',
    type: 'chart' as PostType,
    title: 'COIN following BTC perfectly - Next leg up incoming',
    content: 'The correlation between COIN and Bitcoin price action is undeniable. With BTC breaking above 45k, COIN should test $180 resistance soon. Volume profile shows strong support at $165.',
    chartSymbol: 'COIN',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 92,
    comments: 41,
    isLiked: false
  }
];

// Sample user data
const SAMPLE_USER = {
  id: '1',
  username: 'herotrader',
  name: 'Hero Trader',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hero',
  bio: 'Long-term investor focused on tech and healthcare. Always learning, always growing.',
  followers: 1247,
  following: 389,
  memberSince: new Date('2024-01-15'),
  realizedProfit: 15420.50
};

const SAMPLE_RECENT_POSTS = [
  {
    id: 'r1',
    title: 'My thoughts on the recent Fed decision',
    community: 'SPY',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: 'r2',
    title: 'AAPL earnings play worked perfectly!',
    community: 'AAPL',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: 'r3',
    title: 'New position in MSFT',
    community: 'MSFT',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

const SAMPLE_FAVORITE_COMMUNITIES = [
  { symbol: 'AAPL', name: 'Apple Inc.', memberCount: 45230 },
  { symbol: 'SPY', name: 'S&P 500 ETF', memberCount: 89450 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', memberCount: 34120 },
  { symbol: 'General', name: 'General Discussion', memberCount: 125000 }
];

const SAMPLE_RECENT_COMMUNITIES = [
  { symbol: 'TSLA' },
  { symbol: 'AMD' },
  { symbol: 'GOOGL' },
  { symbol: 'META' },
  { symbol: 'QQQ' }
];

type FilterType = 'all' | 'following' | 'symbol' | 'general';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState(SAMPLE_POSTS);

  // Filter posts based on selected filter
  const filteredPosts = posts.filter(post => {
    if (filter === 'general') return post.community === 'General';
    if (filter === 'symbol' && selectedSymbol) return post.community === selectedSymbol;
    if (filter === 'following') return post.isLiked; // Simulating following filter
    return true; // 'all' filter
  });

  // Get popular symbols for quick filters
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'General'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post Button */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center space-x-3">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex-1 text-left px-4 py-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  What\'s on your mind?
                </button>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Add Image">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Add Chart">
                    <TrendingUp className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Add Link">
                    <LinkIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setFilter('following')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === 'following'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Following
                  </button>
                  <button
                    onClick={() => setFilter('general')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filter === 'general'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    General
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setFilter('symbol')}
                      className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        filter === 'symbol'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      Symbol
                    </button>
                  </div>
                </div>

                {/* Symbol Search */}
                {filter === 'symbol' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter symbol..."
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Quick Symbol Filters */}
              <div className="flex flex-wrap gap-2">
                {popularSymbols.map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => {
                      setFilter(symbol === 'General' ? 'general' : 'symbol');
                      if (symbol !== 'General') setSelectedSymbol(symbol);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      (filter === 'symbol' && selectedSymbol === symbol) ||
                      (filter === 'general' && symbol === 'General')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {symbol === 'General' ? 'General' : `$${symbol}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <Post key={post.id} {...post} />
                ))
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <p className="text-gray-500">No posts found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {filter === 'symbol' && selectedSymbol
                      ? `Be the first to post about $${selectedSymbol}!`
                      : 'Check back later for new content'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - User Profile */}
          <div className="lg:col-span-1">
            <UserProfileCard
              user={SAMPLE_USER}
              recentPosts={SAMPLE_RECENT_POSTS}
              recentCommunities={SAMPLE_RECENT_COMMUNITIES}
              favoriteCommunities={SAMPLE_FAVORITE_COMMUNITIES}
            />
          </div>
        </div>
      </div>

      {/* Create Post Modal (placeholder) */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
            <p className="text-gray-500">Post creation modal coming soon...</p>
            <button
              onClick={() => setShowCreatePost(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}