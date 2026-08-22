export default function SkeletonCard() {
  return (
    <div className="
      skeleton
      rounded-xl p-6
      space-y-4
    ">
      <div className="skeleton h-40 rounded-lg" />
      <div className="skeleton h-6 rounded w-3/4" />
      <div className="skeleton h-4 rounded w-full" />
      <div className="skeleton h-4 rounded w-2/3" />
      <div className="skeleton h-10 rounded-lg w-1/2 mt-4" />
    </div>
  );
}
