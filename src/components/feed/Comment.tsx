'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, MessageCircle, MoreHorizontal, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CommentData {
  id: string;
  author: {
    username: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
  replies?: CommentData[];
  depth?: number;
}

interface CommentProps {
  comment: CommentData;
  depth?: number;
}

export function Comment({ comment, depth = 0 }: CommentProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(comment.isLiked || false);
  const [votes, setVotes] = useState(comment.likes);
  const [showMenu, setShowMenu] = useState(false);

  const handleUpvote = () => {
    if (liked) {
      setLiked(false);
      setVotes(votes - 1);
    } else {
      setLiked(true);
      setVotes(votes + 1);
    }
  };

  const handleReply = () => {
    // TODO: Handle reply submission
    console.log('Reply:', replyText);
    setReplyText('');
    setShowReplyBox(false);
  };

  // Reddit-style indentation based on depth
  const marginLeft = depth > 0 ? `${Math.min(depth * 1, 5)}rem` : '0';

  return (
    <div className={`${depth > 0 ? 'border-l-2 border-gray-200' : ''}`} style={{ marginLeft }}>
      <div className="flex gap-3 p-3 hover:bg-gray-50 transition-colors">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleUpvote}
            className={`p-1 hover:bg-gray-200 rounded transition-colors ${
              liked ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className={`text-xs font-medium ${
            liked ? 'text-green-600' : 'text-gray-600'
          }`}>
            {votes}
          </span>
          <button
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          {/* Author info and collapse button */}
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/profile/${comment.author.username}`}>
              {comment.author.profilePicture ? (
                <img
                  src={comment.author.profilePicture}
                  alt={comment.author.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>

            <Link
              href={`/profile/${comment.author.username}`}
              className="text-sm font-medium hover:underline"
            >
              {comment.author.name}
            </Link>

            <span className="text-xs text-gray-500">
              @{comment.author.username}
            </span>

            <span className="text-xs text-gray-400">•</span>

            <span className="text-xs text-gray-500">
              {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
            </span>

            {comment.replies && comment.replies.length > 0 && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isCollapsed ? `[+${comment.replies.length}]` : '[-]'}
                </button>
              </>
            )}
          </div>

          {/* Comment text */}
          {!isCollapsed && (
            <>
              <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
                {comment.content}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  Reply
                </button>

                <button className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Share
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>

                  {showMenu && (
                    <div className="absolute left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => {
                          console.log('Report comment:', comment.id);
                          setShowMenu(false);
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

              {/* Reply box */}
              {showReplyBox && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Nested replies */}
              {!isCollapsed && comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                  {comment.replies.map((reply) => (
                    <Comment
                      key={reply.id}
                      comment={reply}
                      depth={(depth || 0) + 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}