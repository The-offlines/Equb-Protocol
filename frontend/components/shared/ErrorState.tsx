import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-[#F0B54A]/30 bg-[#FFF8ED] p-6 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0B54A]/15 text-[#A06C00]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold tracking-[-0.04em] text-[#1F1B3A]">Unable to load data</h3>
        <p className="text-sm leading-6 text-[#6C6885]">{message}</p>
      </div>
    </div>
  );
}
