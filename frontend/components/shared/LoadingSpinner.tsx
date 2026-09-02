export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5A4BDB]/20 border-t-[#5A4BDB]" />
        <p className="text-sm font-medium text-[#6C6885]">{label}</p>
      </div>
    </div>
  );
}
