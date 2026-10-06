'use client';

import { useState, useMemo } from 'react';
import type { TicketFilterState, TicketListing } from '../_lib/tickets-marketplace.types';
import { mockTicketListings } from '../_lib/tickets-marketplace.mock';

export function useTicketMarketplace(initialListings: TicketListing[] = mockTicketListings) {
  const [filters, setFilters] = useState<TicketFilterState>({
    query: '',
    tier: 'all',
    priceRange: 'all',
    quantity: 'all',
    sortBy: 'newest',
  });

  const setQuery = (query: string) => setFilters((prev) => ({ ...prev, query }));
  const setTier = (tier: string) => setFilters((prev) => ({ ...prev, tier }));
  const setPriceRange = (priceRange: string) => setFilters((prev) => ({ ...prev, priceRange }));
  const setQuantity = (quantity: string) => setFilters((prev) => ({ ...prev, quantity }));
  const setSortBy = (sortBy: TicketFilterState['sortBy']) => setFilters((prev) => ({ ...prev, sortBy }));

  const resetFilters = () => {
    setFilters({
      query: '',
      tier: 'all',
      priceRange: 'all',
      quantity: 'all',
      sortBy: 'newest',
    });
  };

  const filteredListings = useMemo(() => {
    let result = [...initialListings];

    // 1. Keyword search (tier, zone, seat, seller)
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.tierName.toLowerCase().includes(q) ||
          item.zone.toLowerCase().includes(q) ||
          (item.seatNumber && item.seatNumber.toLowerCase().includes(q)) ||
          item.seller.name.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Tier
    if (filters.tier !== 'all') {
      result = result.filter((item) =>
        item.tierName.toLowerCase().includes(filters.tier.toLowerCase())
      );
    }

    // 3. Filter by Price Range
    if (filters.priceRange !== 'all') {
      if (filters.priceRange === 'under_1m') {
        result = result.filter((item) => item.resalePrice < 1000000);
      } else if (filters.priceRange === '1m_to_2m') {
        result = result.filter((item) => item.resalePrice >= 1000000 && item.resalePrice <= 2000000);
      } else if (filters.priceRange === '2m_to_4m') {
        result = result.filter((item) => item.resalePrice > 2000000 && item.resalePrice <= 4000000);
      } else if (filters.priceRange === 'above_4m') {
        result = result.filter((item) => item.resalePrice > 4000000);
      }
    }

    // 4. Filter by Quantity
    if (filters.quantity !== 'all') {
      if (filters.quantity === 'single') {
        result = result.filter((item) => item.quantity === 1);
      } else if (filters.quantity === 'pair') {
        result = result.filter((item) => item.quantity === 2);
      } else if (filters.quantity === 'group') {
        result = result.filter((item) => item.quantity >= 3);
      }
    }

    // 5. Sorting
    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.resalePrice - b.resalePrice);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.resalePrice - a.resalePrice);
    } else if (filters.sortBy === 'reputation') {
      result.sort((a, b) => b.seller.reputationScore - a.seller.reputationScore);
    }

    return result;
  }, [initialListings, filters]);

  return {
    filters,
    setQuery,
    setTier,
    setPriceRange,
    setQuantity,
    setSortBy,
    resetFilters,
    filteredListings,
    totalCount: filteredListings.length,
    hasActiveFilters:
      Boolean(filters.query.trim()) ||
      filters.tier !== 'all' ||
      filters.priceRange !== 'all' ||
      filters.quantity !== 'all',
  };
}
