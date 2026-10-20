'use client';
import { useSyncExternalStore } from 'react';

const eventName = 'ticketverse:url-filters';
function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener('popstate', callback); window.removeEventListener(eventName, callback); };
}
export function useUrlFilters() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  const params = new URLSearchParams(search);
  function update(values: Record<string, string | number | undefined>, replace = false) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    }
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event(eventName));
  }
  const parsedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  return { params, page, update, search };
}
