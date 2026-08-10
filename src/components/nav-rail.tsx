"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/auth/actions";
import { Wordmark } from "@/components/wordmark";

export interface NavEvent {
  slug: string;
  name: string;
  status: string;
}

interface NavRailProps {
  events: NavEvent[];
  userName: string;
  userEmail: string;
  isAdmin: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavRail({
  events,
  userName,
  userEmail,
  isAdmin,
}: NavRailProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Following a link is a completed intent, so close the mobile drawer behind it.
  const close = () => setOpen(false);

  const linkClass = (href: string) =>
    [
      "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[0.875rem] transition-colors",
      isActive(pathname, href)
        ? "bg-white/[0.07] text-rail-ink"
        : "text-rail-ink-2 hover:bg-white/[0.04] hover:text-rail-ink",
    ].join(" ");

  const marker = (href: string) => (
    <span
      aria-hidden
      className={`h-3.5 w-px shrink-0 transition-colors ${
        isActive(pathname, href) ? "bg-brand" : "bg-rail-line"
      }`}
    />
  );

  const body = (
    <>
      <div className="px-6 pt-6 pb-7">
        <Link
          href="/overview"
          onClick={close}
          aria-label="VMI Collective overview"
        >
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-0.5">
          {[
            { href: "/overview", label: "Overview" },
            { href: "/tasks", label: "Tasks" },
            { href: "/team", label: "Team" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className={linkClass(item.href)}
              >
                {marker(item.href)}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="label mt-7 mb-2 px-3 text-rail-ink-2/70">Events</p>
        <ul className="flex flex-col gap-0.5">
          {events.map((event) => {
            const href = `/events/${event.slug}`;
            return (
              <li key={event.slug}>
                <Link href={href} onClick={close} className={linkClass(href)}>
                  {marker(href)}
                  <span className="truncate">{event.name}</span>
                </Link>
              </li>
            );
          })}
          {events.length === 0 ? (
            <li className="px-3 py-2 text-[0.8125rem] text-rail-ink-2">
              No events yet.
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="mt-6 border-t border-rail-line px-6 py-5">
        <p className="flex items-center gap-2 truncate text-[0.875rem] text-rail-ink">
          {userName}
          {isAdmin ? (
            <span className="rounded-full border border-brand/40 px-1.5 py-0.5 font-mono text-[0.5625rem] tracking-[0.12em] text-brand uppercase">
              Admin
            </span>
          ) : null}
        </p>
        <p className="truncate text-[0.75rem] text-rail-ink-2">{userEmail}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-3 font-mono text-[0.6875rem] tracking-[0.14em] text-rail-ink-2 uppercase transition-colors hover:text-brand"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rail-line bg-rail px-4 py-3 lg:hidden">
        <Link
          href="/overview"
          onClick={close}
          aria-label="VMI Collective overview"
        >
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="nav-rail-drawer"
          className="font-mono text-[0.6875rem] tracking-[0.14em] text-rail-ink-2 uppercase"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div
          id="nav-rail-drawer"
          className="fixed inset-x-0 top-[3.3125rem] bottom-0 z-20 flex flex-col bg-rail lg:hidden"
        >
          {body}
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-62 flex-col border-r border-rail-line bg-rail lg:flex">
        {body}
      </aside>
    </>
  );
}
