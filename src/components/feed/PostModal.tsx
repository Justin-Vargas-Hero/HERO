'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Heart, MessageCircle, Share2, Flag, MoreHorizontal, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TradingViewChart from '@/components/market/TradingViewChart';
import { Comment, CommentData } from './Comment';
import { PostType, SentimentType } from './Post';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    author: {
      username: string;
      name: string;
      profilePicture?: string;
      bio?: string;
      followers?: number;
    };
    community: string;
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
    chartData?: any[];
    timestamp: Date;
    likes: number;
    comments: number;
    isLiked?: boolean;
  };
  comments?: CommentData[];
}

// Sample comments data for demonstration
const SAMPLE_COMMENTS: CommentData[] = [
  {
    id: 'c1',
    author: {
      username: 'analyst99',
      name: 'Technical Analyst',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analyst'
    },
    content: 'Great analysis! I\'ve been watching the same pattern. The volume confirmation is key here. Also notice the RSI divergence that\'s been building.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    likes: 23,
    replies: [
      {
        id: 'c1r1',
        author: {
          username: 'traderjoe',
          name: 'Joe Smith',
          profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joe'
        },
        content: 'Exactly! The RSI divergence is what convinced me to enter. Been building my position since $192.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        likes: 8,
        replies: [
          {
            id: 'c1r1r1',
            author: {
              username: 'newtrader',
              name: 'New Trader',
              profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newtrader'
            },
            content: 'Can you explain RSI divergence for beginners?',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            likes: 3
          }
        ]
      }
    ]
  },
  {
    id: 'c2',
    author: {
      username: 'bearcounter',
      name: 'Bear Counter',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bear'
    },
    content: 'I disagree with this thesis. The macro environment is deteriorating and tech valuations are still stretched. We\'re due for a correction.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    likes: 15,
    replies: []
  },
  {
    id: 'c3',
    author: {
      username: 'longterm',
      name: 'Long Term Investor',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=longterm'
    },
    content: 'Price targets and short-term patterns don\'t matter if you\'re holding for 10+ years. Focus on the fundamentals.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    likes: 42
  }
];

export function PostModal({ isOpen, onClose, post, comments = SAMPLE_COMMENTS }: PostModalProps) {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentText, setCommentText] = useState('');
  const [showReportMenu, setShowReportMenu] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    // TODO: Handle comment submission
    console.log('New comment:', commentText);
    setCommentText('');
  };

  const getCommunityStyle = () => {
    if (post.community === 'General') {
      return 'bg-gray-100 text-gray-700';
    }
    return 'bg-blue-50 text-blue-700';
  };

  const getSentimentStyle = () => {
    switch (post.sentiment) {
      case 'bullish':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'bearish':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return null;
    }
  };

  const renderPostContent = () => {
    switch (post.type) {
      case 'image':
        return post.imageUrl ? (
          <div className="mt-4">
            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100" style={{ paddingBottom: '56.25%' }}>
              <img
                src={post.imageUrl}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        ) : null;

      case 'chart':
        return post.chartSymbol ? (
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/symbol/${post.chartSymbol}`}
                className="font-semibold text-lg hover:text-blue-600 transition-colors"
              >
                ${post.chartSymbol}
              </Link>
              <Link
                href={`/symbol/${post.chartSymbol}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View Full Chart →
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden">
              <TradingViewChart
                symbol={post.chartSymbol}
                type="candle"
                height={300}
                data={post.chartData || []}
                interval="5min"
              />
            </div>
          </div>
        ) : null;

      case 'link':
        return post.linkPreview ? (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
          >
            <div className="flex">
              {post.linkPreview.image && (
                <div className="w-48 h-32 flex-shrink-0 bg-gray-100">
                  <img
                    src={post.linkPreview.image}
                    alt={post.linkPreview.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-4">
                <p className="font-medium line-clamp-1">{post.linkPreview.title}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.linkPreview.description}</p>
                <p className="text-xs text-gray-500 mt-2">{post.linkPreview.domain}</p>
              </div>
            </div>
          </a>
        ) : null;

      default:
        return null;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden transform-gpu backface-hidden" style={{ aspectRatio: '16/9', willChange: 'transform', contain: 'layout' }}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold truncate flex-1 mr-4">{post.title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Post Content */}
            <div className="p-6 border-b border-gray-200">
          {/* Author Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${post.author.username}`}>
                {post.author.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg text-gray-600 font-medium">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-medium hover:underline"
                  >
                    {post.author.name}
                  </Link>
                  <span className="text-gray-500 text-sm">@{post.author.username}</span>
                </div>
                {post.author.bio && (
                  <p className="text-sm text-gray-600 mt-1">{post.author.bio}</p>
                )}
                {post.author.followers && (
                  <p className="text-xs text-gray-500 mt-1">{post.author.followers.toLocaleString()} followers</p>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>

              {showReportMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      console.log('Report post:', post.id);
                      setShowReportMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Flag className="w-3 h-3" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Community and Sentiment badges */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              href={post.community === 'General' ? '/community/general' : `/symbol/${post.community}`}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCommunityStyle()}`}
            >
              {post.community === 'General' ? 'General' : `$${post.community}`}
            </Link>
            {post.sentiment && post.sentiment !== 'neutral' && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSentimentStyle()}`}>
                {post.sentiment === 'bullish' ? '🟢 Bullish' : '🔴 Bearish'}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(post.timestamp, { addSuffix: true })}
            </span>
          </div>

          {/* Post Content */}
          <p className="text-base text-gray-800 whitespace-pre-wrap">{post.content}</p>

          {/* Media Content */}
          {renderPostContent()}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  liked
                    ? 'bg-red-50 text-red-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likesCount}</span>
              </button>

              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{comments.length}</span>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </button>
            </div>
          </div>
            </div>

            {/* Comment Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-medium">U</span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-4">
              <h3 className="font-semibold mb-4">Comments ({comments.length})</h3>
              <div className="space-y-2">
                {comments.map((comment) => (
                  <Comment key={comment.id} comment={comment} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}