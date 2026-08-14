const GRADS = [
  "from-orange-500 to-pink-500",
  "from-green-500 to-teal-500",
  "from-blue-500 to-purple-500",
  "from-red-500 to-orange-500",
  "from-yellow-500 to-red-500",
  "from-teal-400 to-blue-500",
];

export default function Avatar({ name, size = 48, online }: { name?: string; size?: number; online?: boolean }) {
  const n = (name || "?").trim();
  const initials = n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  let hash = 0;
  for (const ch of n) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const grad = GRADS[hash % GRADS.length];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${grad} font-black text-white`}
        style={{ fontSize: size * 0.38 }}>
        {initials || "?"}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0d0a12] bg-green-500" />
      )}
    </div>
  );
}
