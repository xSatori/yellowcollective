export const getProposalName = (description: string) => {
  try {
    const parsed = JSON.parse(description) as { title?: string };
    if (parsed.title) return parsed.title;
  } catch {
    // Builder proposals may use the legacy title&&description format.
  }

  return description.split("&&")[0];
};
