'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/explore', label: 'Explore', icon: CompassIcon },
    { href: '/profile', label: 'Profile', icon: UserIcon },
    { href: '/more', label: 'More', icon: DotsIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 h-[calc(100vh-56px)] sticky top-14 bg-white border-r border-gray-200 text-gray-700">
      <nav className="flex flex-col gap-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition ${
              pathname === href ? 'bg-gray-100 text-black' : ''
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/* --- Simple icons (outline style to match your topbar) --- */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
      />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a9 9 0 100 18 9 9 0 000-18zM14.12 14.12l1.41-4.24-4.24 1.41-1.41 4.24 4.24-1.41z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            {/* Head */}
            <circle cx="12" cy="8.5" r="3.75" />
            {/* Body (shifted down a bit to create neck space) */}
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 21a8.25 8.25 0 0115 0"
            />
        </svg>
    );
}


function DotsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12h.01M12 12h.01M18 12h.01"
      />
    </svg>
  );
}
