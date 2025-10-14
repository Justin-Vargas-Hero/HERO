'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, UserPlus, DollarSign, ChevronDown, Star, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface RecentPost {
  id: string;
  title: string;
  community: string;
  timestamp: Date;
}

interface Community {
  symbol: string;
  name?: string;
  memberCount?: number;
}

interface UserProfileCardProps {
  user: {
    id: string;
    username: string;
    name: string;
    profilePicture?: string;
    bio?: string;
    followers: number;
    following: number;
    memberSince: Date;
    realizedProfit: number;
  };
  recentPosts: RecentPost[];
  recentCommunities: Community[];
  favoriteCommunities: Community[];
}

export function UserProfileCard({
  user,
  recentPosts,
  recentCommunities,
  favoriteCommunities
}: UserProfileCardProps) {
  const [showAllPosts, setShowAllPosts] = useState(false);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const displayedPosts = showAllPosts ? recentPosts : recentPosts.slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
      {/* Profile Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-start space-x-4">
          <Link href={`/profile/${user.username}`}>
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          <div className="flex-1">
            <Link
              href={`/profile/${user.username}`}
              className="font-semibold text-base hover:underline"
            >
              {user.name}
            </Link>
            <p className="text-sm text-gray-500">@{user.username}</p>
            {user.bio && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Followers</p>
                <p className="font-semibold text-lg">{user.followers.toLocaleString()}</p>
              </div>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Following</p>
                <p className="font-semibold text-lg">{user.following.toLocaleString()}</p>
              </div>
              <UserPlus className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="font-semibold text-sm">
                  {user.memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className={`rounded-lg p-3 ${user.realizedProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Realized P&L</p>
                <p className={`font-semibold text-lg ${
                  user.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.realizedProfit >= 0 ? '+' : ''}{formatCurrency(Math.abs(user.realizedProfit), 0)}
                </p>
              </div>
              <TrendingUp className={`w-4 h-4 ${
                user.realizedProfit >= 0 ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-sm mb-3">Recent Posts</h3>
          <div className="space-y-2">
            {displayedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block p-2 -mx-2 rounded hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-600 font-medium">
                    ${post.community}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(post.timestamp)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {recentPosts.length > 3 && (
            <button
              onClick={() => setShowAllPosts(!showAllPosts)}
              className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1"
            >
              {showAllPosts ? 'Show less' : `Show ${recentPosts.length - 3} more`}
              <ChevronDown className={`w-3 h-3 transition-transform ${showAllPosts ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Favorite Communities */}
      {favoriteCommunities.length > 0 && (
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            Favorite Communities
          </h3>
          <div className="space-y-2">
            {favoriteCommunities.map((community) => (
              <Link
                key={community.symbol}
                href={community.symbol === 'General' ? '/community/general' : `/symbol/${community.symbol}`}
                className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {community.symbol === 'General' ? 'General' : `$${community.symbol}`}
                  </p>
                  {community.name && (
                    <p className="text-xs text-gray-500 line-clamp-1">{community.name}</p>
                  )}
                </div>
                {community.memberCount && (
                  <span className="text-xs text-gray-500">
                    {community.memberCount.toLocaleString()} members
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Visited */}
      {recentCommunities.length > 0 && (
        <div className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            Recently Visited
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentCommunities.map((community) => (
              <Link
                key={community.symbol}
                href={community.symbol === 'General' ? '/community/general' : `/symbol/${community.symbol}`}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium transition-colors"
              >
                {community.symbol === 'General' ? 'General' : `$${community.symbol}`}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}