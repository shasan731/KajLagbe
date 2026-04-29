"use client";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

export function ImageUrlInputList({
  name,
  defaultValue = [],
  max = 8,
}: {
  name: string;
  defaultValue?: string[];
  max?: number;
}) {
  const [urls, setUrls] = useState<string[]>(
    defaultValue.length > 0 ? defaultValue : [""]
  );

  function update(i: number, value: string) {
    setUrls((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }
  function add() {
    if (urls.length >= max) return;
    setUrls((prev) => [...prev, ""]);
  }
  function remove(i: number) {
    setUrls((prev) => (prev.length === 1 ? [""] : prev.filter((_, idx) => idx !== i)));
  }

  const filled = urls.filter((u) => u.trim().length > 0);

  return (
    <div className="space-y-2">
      {urls.map((u, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={u}
            onChange={(e) => update(i, e.target.value)}
            className="input flex-1"
          />
          <button
            type="button"
            className="btn-ghost px-2"
            onClick={() => remove(i)}
            aria-label="Remove URL"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {urls.length < max && (
        <button type="button" className="btn-ghost text-sm" onClick={add}>
          <Plus size={16} /> Add another image URL
        </button>
      )}
      {filled.map((u, i) => (
        <input key={`hidden-${i}`} type="hidden" name={name} value={u} />
      ))}
      <p className="text-xs text-gray-500">
        Paste public image URLs. Cloudinary upload can be added later.
      </p>
    </div>
  );
}
