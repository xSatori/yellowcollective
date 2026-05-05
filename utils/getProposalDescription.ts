export const getProposalDescription = (description: string) => {
  try {
    const parsed = JSON.parse(description) as { description?: string };
    if (parsed.description) return parsed.description;
  } catch {
    // Builder proposals may use the legacy title&&description format.
  }

  return description.split("&&")[1] || description;
};
