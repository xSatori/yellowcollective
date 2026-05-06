import useSWR from "swr";

export const useNounsBalance = ({ user }: { user?: string }) => {
  return useSWR<string>(user ? `/api/nouns/balance/${user}` : undefined);
};
