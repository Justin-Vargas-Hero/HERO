'use client';

interface LivePingProps {
  status?: 'live' | 'offline';
  className?: string;
}

export function LivePing({ status = 'live', className = '' }: LivePingProps) {
  const isLive = status === 'live';
  
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span className="relative inline-flex h-2 w-2">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </span>
    </div>
  );
}