import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListings, type ListingFilters, type ListingSort } from "@/services/listingsService";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar } from "@/components/FilterBar";

export const Route = createFileRoute("/browse")({
  head: () => ({ meta: [{ title: "Browse verified recipes — Pickture" }, { name: "description", content: "Filter by model, style, price, usage rights, and consistency score." }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const [filters, setFilters] = useState<ListingFilters>({});
  const [sort, setSort] = useState<ListingSort>("newest");
  const { data, isLoading } = useQuery({
    queryKey: ["listings", filters, sort],
    queryFn: () => getListings(filters, sort, 1, 48),
  });
  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <span className="label-eyebrow">Marketplace</span>
        <h1 className="font-display text-4xl md:text-5xl mt-2">All verified recipes</h1>
      </div>
      <FilterBar filters={filters} sort={sort} onChange={setFilters} onSort={setSort} />
      <div className="mt-8">
        {isLoading ? (
          <p className="text-neutral-gray">Loading recipes…</p>
        ) : items.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <div className="mx-auto h-16 w-16 border border-ink flex items-center justify-center label-eyebrow mb-4">Lottie</div>
            <h3 className="font-display text-2xl">No verified recipes match this search.</h3>
            <p className="text-sm text-neutral-gray mt-2">Try broadening the model, price, or usage filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
