import Button from "./Button";
import Image from "next/image";
import Link from "next/link";

const navItems = [
  {
    href: "https://warpcast.com/~/channel/yellow",
    src: "/farcaster.svg",
  },
];

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center gap-16 pb-16 pt-4">
      <div className="flex flex-wrap items-center gap-4">
        {navItems.map((item, i) => (
          <Button variant="secondary" size="rounded" key={i}>
            <Link
              href={item.href}
              target="_blank"
              rel="noreferer noopener noreferrer"
            >
              <Image src={item.src} width={24} height={24} alt="" />
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
