export default function Loading() {
  return (
    <div className="container-page py-12" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
      </div>
    </div>
  );
}
