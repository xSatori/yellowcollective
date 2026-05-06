import { ReactNode, useState } from "react";

export type ProposalTabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export default function ProposalTabs({ items }: { items: ProposalTabItem[] }) {
  const [activeTab, setActiveTab] = useState(items[0]?.id);
  const activeItem = items.find((item) => item.id === activeTab) || items[0];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap justify-center gap-3 border-b border-skin-stroke">
        {items.map((item) => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`rounded-t-xl border border-b-0 border-skin-stroke px-5 py-3 font-heading text-base font-bold shadow-[4px_0px_0px_0px_#BBB] transition-colors active:translate-x-1 active:shadow-none ${
                isActive
                  ? "bg-white text-skin-base"
                  : "bg-[#fff7bf] text-secondary hover:bg-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div>{activeItem.content}</div>
    </div>
  );
}
