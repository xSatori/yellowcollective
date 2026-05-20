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
      <div className="relative z-10 flex flex-nowrap justify-center gap-1 sm:gap-3">
        {items.map((item) => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`proposal-detail-tab relative min-w-0 flex-1 whitespace-nowrap rounded-t-xl border-x border-t border-skin-stroke px-2 py-3 text-center font-heading text-sm font-bold leading-none transition-colors active:translate-x-1 active:shadow-none sm:flex-none sm:px-5 sm:text-base ${
                isActive
                  ? "proposal-detail-tab-active bg-white text-skin-base shadow-[4px_0px_0px_0px_rgb(var(--color-shadow-neutral))]"
                  : "proposal-detail-tab-inactive bg-[#fff7bf] text-secondary hover:bg-white"
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
