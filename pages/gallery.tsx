import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/art",
    permanent: true,
  },
});

export default function GalleryRedirectPage() {
  return null;
}
