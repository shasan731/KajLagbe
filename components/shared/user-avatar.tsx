export function UserAvatar({
  name,
  url,
  size = 36,
}: {
  name?: string | null;
  url?: string | null;
  size?: number;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? ""}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-brand-100 text-brand-800 font-semibold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  );
}
