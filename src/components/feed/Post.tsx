'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TradingViewChart from '@/components/market/TradingViewChart';

export type PostType = 'text' | 'image' | 'chart' | 'link';
export type SentimentType = 'bullish' | 'bearish' | 'neutral';

interface PostProps {
  id: string;
  author: {
    username: string;
    name: string;
    profilePicture?: string;
  };
  community: string; // Symbol or "General"
  type: PostType;
  title: string;
  content: string;
  sentiment?: SentimentType;
  imageUrl?: string;
  linkUrl?: string;
  linkPreview?: {
    title: string;
    description: string;
    image?: string;
    domain: string;
  };
  chartSymbol?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked?: boolean;
  chartData?: any[]; // For embedded chart data
}

export function Post({
  id,
  author,
  community,
  type,
  title,
  content,
  sentiment,
  imageUrl,
  linkUrl,
  linkPreview,
  chartSymbol,
  timestamp,
  likes,
  comments,
  isLiked = false,
  chartData
}: PostProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Reporting post:', id);
    setShowReportMenu(false);
  };

  // Get community badge color
  const getCommunityStyle = () => {
    if (community === 'General') {
      return 'bg-gray-100 text-gray-700';
    }
    return 'bg-blue-50 text-blue-700';
  };

  // Get sentiment badge style
  const getSentimentStyle = () => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'bearish':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return null;
    }
  };

  const renderPostContent = () => {
    switch (type) {
      case 'image':
        return imageUrl ? (
          <div className="mt-3">
            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        ) : null;

      case 'chart':
        return chartSymbol ? (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/symbol/${chartSymbol}`}
                className="font-semibold text-lg hover:text-blue-600 transition-colors"
              >
                ${chartSymbol}
              </Link>
              <Link
                href={`/symbol/${chartSymbol}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View Full Chart →
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden">
              <TradingViewChart
                symbol={chartSymbol}
                type="candle"
                height={250}
                data={chartData || []}
                interval="5min"
              />
            </div>
          </div>
        ) : null;

      case 'link':
        return linkPreview ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
          >
            <div className="flex">
              {linkPreview.image && (
                <div className="w-32 h-32 flex-shrink-0 bg-gray-100">
                  <img
                    src={linkPreview.image}
                    alt={linkPreview.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-3">
                <p className="font-medium text-sm line-clamp-1">{linkPreview.title}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{linkPreview.description}</p>
                <p className="text-xs text-gray-500 mt-2">{linkPreview.domain}</p>
              </div>
            </div>
          </a>
        ) : linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-blue-600 hover:underline text-sm"
          >
            {linkUrl}
          </a>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${author.username}`}>
              {author.profilePicture ? (
                <img
                  src={author.profilePicture}
                  alt={author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${author.username}`}
                  className="font-medium text-sm hover:underline"
                >
                  {author.name}
                </Link>
                <span className="text-gray-500 text-xs">@{author.username}</span>
                <span className="text-gray-400 text-xs">·</span>
                <span className="text-gray-500 text-xs">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={community === 'General' ? '/community/general' : `/symbol/${community}`}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCommunityStyle()}`}
                >
                  {community === 'General' ? 'General' : `$${community}`}
                </Link>
                {sentiment && sentiment !== 'neutral' && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSentimentStyle()}`}>
                    {sentiment === 'bullish' ? '🟢 Bullish' : '🔴 Bearish'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>

            {showReportMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleReport}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Flag className="w-3 h-3" />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2">{title}</h3>

        {/* Content */}
        {content && (
          <p className={`text-sm text-gray-700 ${!expanded && content.length > 280 ? 'line-clamp-3' : ''}`}>
            {content}
          </p>
        )}

        {content.length > 280 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 text-sm hover:underline mt-1"
          >
            Show more
          </button>
        )}

        {/* Media Content */}
        {renderPostContent()}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                liked
                  ? 'bg-red-50 text-red-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{likesCount}</span>
            </button>

            <Link
              href={`/post/${id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{comments}</span>
            </Link>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}