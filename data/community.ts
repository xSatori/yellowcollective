export type CommunityProject = {
  slug: string;
  title: string;
  description: string;
  details: string[];
  artist: string;
  category: string;
  date: string;
  href: string;
  image: string;
  galleryImages?: string[];
  links?: Array<{
    title: string;
    href: string;
  }>;
};

export const communityProjects: CommunityProject[] = [];
