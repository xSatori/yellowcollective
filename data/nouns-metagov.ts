import {
  getBooleanSiteSetting,
  setBooleanSiteSetting,
} from "data/site-settings";

export const NOUNS_METAGOV_SETTING_KEY = "nouns_metagov_enabled";

export const getNounsMetagovEnabled = () =>
  getBooleanSiteSetting(NOUNS_METAGOV_SETTING_KEY, true);

export const setNounsMetagovEnabled = (enabled: boolean) =>
  setBooleanSiteSetting(NOUNS_METAGOV_SETTING_KEY, enabled);
