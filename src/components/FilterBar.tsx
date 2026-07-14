import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { ListingFilters, ListingSort } from "@/services/listingsService";
import { SUPPORTED_MODELS } from "@/lib/models";

const TYPES = ["Product", "Portrait", "Architecture", "Fashion", "Food", "Mockup", "Logo", "Interior", "Automotive", "Illustration", "Concept"];
const RIGHTS = ["personal", "commercial", "extended"] as const;

export function FilterBar({
  filters, sort, onChange, onSort,
}: {
  filters: ListingFilters;
  sort: ListingSort;
  onChange: (f: ListingFilters) => void;
  onSort: (s: ListingSort) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border border-border bg-card">
      <Input placeholder="Search recipes…" value={filters.q ?? ""} onChange={(e) => onChange({ ...filters, q: e.target.value })} className="md:col-span-2" />
      <Select value={filters.model ?? "all"} onValueChange={(v) => onChange({ ...filters, model: v === "all" ? undefined : v })}>
        <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All models</SelectItem>
          {SUPPORTED_MODELS.map((m) => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.imageType ?? "all"} onValueChange={(v) => onChange({ ...filters, imageType: v === "all" ? undefined : v })}>
        <SelectTrigger><SelectValue placeholder="Image type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.usageRights ?? "all"} onValueChange={(v) => onChange({ ...filters, usageRights: v === "all" ? undefined : (v as ListingFilters["usageRights"]) })}>
        <SelectTrigger><SelectValue placeholder="Usage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any usage</SelectItem>
          {RIGHTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => onSort(v as ListingSort)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="top_rated">Highest rated</SelectItem>
          <SelectItem value="price_asc">Price: low to high</SelectItem>
          <SelectItem value="best_consistency">Best consistency</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
