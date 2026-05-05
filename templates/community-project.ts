import type { CommunityProject } from "../data/community";

// Copy this object into data/community-projects/your-project-slug.json and update each field.
// The slug becomes the project URL: /community/your-project-slug
export const communityProjectTemplate: CommunityProject = {
  slug: "your-project-slug",
  title: "Project title",
  description:
    "One short sentence that explains what this project is for the community gallery.",
  details: [
    "Longer paragraph explaining what the project was, where it came from, and why it matters.",
    "Optional second paragraph with context about the artist, proposal, event, or community impact.",
  ],
  artist: "Artist or creator name",
  category: "Art",
  date: "2026",
  href: "https://example.com",
  image: "https://example.com/your-image.png",
  galleryImages: [
    "https://example.com/optional-gallery-image-one.png",
    "https://example.com/optional-gallery-image-two.png",
  ],
  links: [
    {
      title: "Context link",
      href: "https://example.com/context",
    },
  ],
};
