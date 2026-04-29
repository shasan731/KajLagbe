"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { BD_CITIES } from "@/lib/constants";

const TYPES = [
  { value: "", label: "All types" },
  { value: "TOOL_ONLY", label: "Tool only" },
  { value: "SKILL_ONLY", label: "Skill only" },
  { value: "TOOL_WITH_OPERATOR", label: "Tool + operator" },
  { value: "PACKAGE", label: "Package" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function ListingFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [area, setArea] = useState(params.get("area") ?? "");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");
  const [delivery, setDelivery] = useState(params.get("delivery") === "1");

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type) next.set("type", type);
    if (city) next.set("city", city);
    if (area) next.set("area", area);
    if (min) next.set("min", min);
    if (max) next.set("max", max);
    if (sort) next.set("sort", sort);
    if (delivery) next.set("delivery", "1");
    startTransition(() => router.push(`/listings?${next.toString()}`));
  }

  function reset() {
    setQ("");
    setType("");
    setCity("");
    setArea("");
    setMin("");
    setMax("");
    setSort("newest");
    setDelivery(false);
    startTransition(() => router.push("/listings"));
  }

  return (
    <form onSubmit={apply} className="card p-4 grid gap-3 md:grid-cols-12">
      <div className="md:col-span-4">
        <label className="label">Search</label>
        <input
          className="input"
          placeholder="Drill, electrician, projector…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Type</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label">City</label>
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Any</option>
          {BD_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label">Area</label>
        <input
          className="input"
          placeholder="Mirpur"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>
      <div className="md:col-span-1">
        <label className="label">Min ৳</label>
        <input
          className="input"
          inputMode="numeric"
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="md:col-span-1">
        <label className="label">Max ৳</label>
        <input
          className="input"
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="md:col-span-3">
        <label className="label">Sort</label>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-3 flex items-end">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={delivery}
            onChange={(e) => setDelivery(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          Delivery available
        </label>
      </div>
      <div className="md:col-span-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={reset}>
          Reset
        </button>
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
      </div>
    </form>
  );
}
