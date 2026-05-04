export type CommunityProject = {
  slug: string;
  title: string;
  description: string;
  details: string[];
  contributor: string;
  artist: string;
  category: string;
  date: string;
  href: string;
  image: string;
  accent: "yellow" | "blue" | "black";
};

export const featuredCommunityProject: CommunityProject = {
  slug: "collective-nouns-trait-contests",
  title: "Collective Nouns Trait Contests",
  description:
    "Community artists contribute heads, accessories, and visual ideas that shape the evolving Collective Nouns collection.",
  details: [
    "A community-led art program for submitting visual ideas, traits, and experiments that can influence the Collective Nouns collection.",
    "The work comes from artists around the Yellow Collective ecosystem and gives the DAO a shared visual archive to reference when coordinating new creative rounds.",
  ],
  contributor: "Yellow Collective artists",
  artist: "Yellow Collective artists",
  category: "Art",
  date: "Season 01",
  href: "https://warpcast.com/~/channel/yellow",
  image: "/og-image.png",
  accent: "yellow",
};

export const communityProjects: CommunityProject[] = [
  featuredCommunityProject,
  {
    slug: "superchain-mint-experiments",
    title: "Superchain Mint Experiments",
    description:
      "Creator drops and onchain media experiments published across Base, Zora, and the wider Superchain.",
    details: [
      "A set of creator experiments around Base, Zora, and Superchain distribution.",
      "These projects are meant to test how Yellow Collective artists can publish, share, and archive work using onchain media primitives.",
    ],
    contributor: "TNS creators",
    artist: "TNS creators",
    category: "Minting",
    date: "2024",
    href: "https://warpcast.com/~/channel/yellow",
    image: "/banner.png",
    accent: "blue",
  },
  {
    slug: "yellow-weekly-spaces",
    title: "Yellow Weekly Spaces",
    description:
      "Community calls, auction recaps, artist spotlights, and coordination for upcoming creative rounds.",
    details: [
      "Recurring community programming for surfacing artists, auction activity, and upcoming work.",
      "The project helps keep the DAO legible to members who follow Yellow through Farcaster and community media.",
    ],
    contributor: "The Noun Square",
    artist: "The Noun Square",
    category: "Events",
    date: "Ongoing",
    href: "https://warpcast.com/~/channel/yellow",
    image: "/noggles.png",
    accent: "black",
  },
  {
    slug: "collective-noun-visual-archive",
    title: "Collective Noun Visual Archive",
    description:
      "A living gallery of auctioned Collective Nouns, submitted traits, and community-made derivative artwork.",
    details: [
      "A visual record of auctioned nouns, community-made derivatives, and submitted creative work.",
      "The archive gives future contributors a place to understand what has already been made and where new visual directions can emerge.",
    ],
    contributor: "Community curators",
    artist: "Community curators",
    category: "Gallery",
    date: "Upcoming",
    href: "https://yellowcollective.xyz",
    image: "/white-drip.png",
    accent: "yellow",
  },
  {
    slug: "artist-grant-pilots",
    title: "Artist Grant Pilots",
    description:
      "Small grants and commissions for nounish artists building public goods, media, and experimental visuals.",
    details: [
      "A governance-backed funding track for smaller creative experiments and artist commissions.",
      "The project is intended to help contributors move from idea to shipped work without needing every initiative to become a large proposal.",
    ],
    contributor: "Governance",
    artist: "Yellow Collective governance",
    category: "Grants",
    date: "Planned",
    href: "/proposals",
    image: "/black-drip.png",
    accent: "blue",
  },
];
