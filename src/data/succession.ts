// Official lines of succession (covers base game + Pegasus + Exodus + Daybreak).
// Cylon Leaders never hold titles, so they are not listed.
export type TitleId = "president" | "admiral" | "cag";

export const TITLE_LABEL: Record<TitleId, string> = {
  president: "President",
  admiral: "Admiral",
  cag: "CAG",
};

export const succession: Record<TitleId, string[]> = {
  admiral: [
    "helena", "william", "saul", "helo", "felix", "louis", "tom-alt", "apollo", "dee",
    "helo-alt", "starbuck", "kat", "boomer", "hotdog", "samuel", "chief", "cally", "doc",
    "apollo-alt", "tom", "ellen", "gaius-alt", "gaius", "romo", "tory", "laura",
  ],
  president: [
    "laura", "gaius", "apollo-alt", "tom", "romo", "tory", "ellen", "apollo", "tom-alt",
    "felix", "william", "helo", "chief", "gaius-alt", "cally", "doc", "helena", "dee",
    "louis", "helo-alt", "boomer", "saul", "hotdog", "samuel", "starbuck", "kat",
  ],
  cag: [
    "apollo", "starbuck", "kat", "helo-alt", "boomer", "hotdog", "samuel", "apollo-alt",
    "helo", "william", "helena", "saul", "felix", "dee", "louis", "tom-alt", "chief",
    "cally", "doc", "tom", "ellen", "gaius-alt", "gaius", "tory", "romo", "laura",
  ],
};
