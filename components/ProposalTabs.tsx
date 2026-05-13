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
      <div className="flex flex-nowrap justify-center gap-1 border-b border-skin-stroke sm:gap-3">
        {items.map((item) => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-w-0 flex-1 whitespace-nowrap rounded-t-xl border border-b-0 border-skin-stroke px-2 py-3 text-center font-heading text-sm font-bold leading-none shadow-[4px_0px_0px_0px_#BBB] transition-colors active:translate-x-1 active:shadow-none sm:flex-none sm:px-5 sm:text-base ${
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
