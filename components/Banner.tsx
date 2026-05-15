export default function Banner() {
  return (
    <div className="hidden w-full flex-col items-center justify-center md:flex">
      <div className="flex w-full items-center justify-center bg-dark px-4 pb-1 pt-2 text-center font-bold text-skin-inverted">
        Collective Nouns: A Community-Curated Daily Auction on BASE in Support
        of The Yellow Collective
      </div>
      <div className="relative mb-2 h-[16px] w-full -translate-y-0.5">
        <div aria-hidden="true" className="theme-header-drip-mask h-full w-full" />
      </div>
    </div>
  );
}
