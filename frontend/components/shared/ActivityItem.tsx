import type { ActivityItem as ActivityItemType } from "@/types";

const dotColors = {
  joined: "bg-[#5A4BDB]",
  paid: "bg-[#3BB273]",
  received: "bg-[#1F1B3A]",
  member_joined: "bg-[#6C6885]",
};

type ActivityItemProps = {
  item: ActivityItemType;
};

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#1F1B3A]/5 bg-[#F6F3EC]/30 p-3">
      <div className="flex items-start pt-1">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[item.type]}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[#1F1B3A]">{item.description}</p>
          <span className="text-xs text-[#6C6885]">{item.date}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6C6885]">
          <span>{item.groupName}</span>
          {item.amount !== null ? (
            <>
              <span>•</span>
              <span className="font-semibold text-[#1F1B3A]">
                ${item.amount.toLocaleString()} USDC
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
