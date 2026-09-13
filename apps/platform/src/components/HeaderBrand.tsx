/** Board chrome brand: runner mark + wordmark. */
export default function HeaderBrand() {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-ink">
        <path
          fill="currentColor"
          d="M13.5 5.5a2 2 0 1 0-2 0 2 2 0 0 0 2 0m-3.2 3.2 1.6 1.8-1.1 6.1 1.9.3.8-4.4 1.4 1.2 2.1 5.2 1.8-.7-2-5-1.9-1.6.6-2.1 2.4 1.2.8-1.8-3.2-1.6-1.7-1.9z"
        />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-ink">RunMax</span>
    </div>
  );
}
