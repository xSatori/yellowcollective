import FaqElement from "@/components/FaqElement";
import ExternalLink from "./ExternalLink";

interface FaqItem {
  title: string;
  content: React.ReactNode;
}

const faqItems: FaqItem[] = [
  {
    title: "An Evolving Collection",
    content: (
      <>
        <p>
          Periodically, The Yellow Collective will host a community-wide art
          contest and choose a new set of traits (heads and accessories) that
          will then be inducted into the collection. We may also decide as a
          Collective to retire certain traits at these intervals. This way, the
          Collection will always feel fresh and community-curated!
        </p>
      </>
    ),
  },
  {
    title: "Collective Nounders",
    content: (
      <>
        <p>The Yellow Collective was founded by (alphabetically):</p>
        <ul className="list-disc list-inside pl-4">
          <li>
            <ExternalLink href="https://x.com/benbodhi?s=21">
              Benbodhi
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/brettdrawsstuff?s=21">
              BrettDrawsStuff
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/jackwyldes?s=21">
              JackWyldes
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/joshuafisher?s=21">
              Joshua Fisher
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://paperclip.xyz">
              Paperclip Labs
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/profwerder?s=21">
              Prof Werder
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/robotfishgirl?s=21">
              RobotFishGirl
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://twitter.com/vellayan_0">
              Santhosh
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/supertightwoody?s=21">
              SuperTightWoody
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/symbiotech?s=21">
              Symbiotech
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://twitter.com/toady_hawk">
              Toady Hawk
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://x.com/mamaxargs?s=21">
              Xargs
            </ExternalLink>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Periodic Automatic Allocations",
    content: (
      <>
        <p>
          Every 10th Collective Noun will go to the Collective Nounder wallet as
          an incentive-aligning founders{"'"} reward.
        </p>
      </>
    ),
  },
  {
    title: "Relationship to Nouns DAO",
    content: (
      <>
        <p>
          The Yellow Collective and Collective Nouns would not exist without the
          gargantuan efforts of the Nounders, and everyone who has contributed
          and built Nouns DAO into what it is today- a paragon of decentralized
          community experimentation. TYC thanks Nouns for making their protocol
          open source, their art CC0, and for funding Zora to create Nouns
          Builder, a tool that allows {"'"}Maximum Viable Communities{"'"} like
          TNS to create an onchain club in just a few clicks. What a time to be
          alive!
        </p>
      </>
    ),
  },
];

export default function Faq() {
  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full flex-col items-center justify-center bg-primary py-8">
        <div className="flex w-full max-w-[754px] flex-col gap-8 bg-primary px-6 [&>p]:text-secondary">
          <h2 className="md:px-4 pt-8">More Info:</h2>
          <div className="flex flex-col gap-8 md:gap-4 w-full">
            {faqItems.map((item, i) => (
              <FaqElement title={item.title} key={i}>
                {item.content}
              </FaqElement>
            ))}
          </div>
        </div>
      </div>
      <div className="relative h-[68px] w-full -translate-y-1">
        <div
          aria-hidden="true"
          className="theme-surface-drip-mask theme-surface-drip-mask-bottom h-full w-full"
        />
      </div>
    </div>
  );
}
