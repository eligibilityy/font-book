import { DEFAULT_SAMPLE_TEXT } from "@shared/contracts/storage";

/**
 * Ready-made Sample texts for common questions: does it work as a headline,
 * as running text, does it have every letter and figure, the accents.
 * Each fits the Sample text's 300-character limit.
 */
export const SAMPLE_PRESETS: readonly { name: string; text: string }[] = [
  { name: "Pangram", text: DEFAULT_SAMPLE_TEXT },
  { name: "Headline", text: "The Spring Show Opens Friday at Seven" },
  {
    name: "Paragraph",
    text: "Typography gives language a visible form. A good text face is quiet: the reader forgets the letters and follows the words. Set a few lines at reading size to see the texture of the page, the rhythm of the spacing, and how evenly the colour falls.",
  },
  {
    name: "Alphabet and Figures",
    text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &?!@#%()",
  },
  {
    name: "Accents",
    text: "Ñandú, café, naïve, façade, Zürich, São Paulo, Łódź, Ærøskøbing, Đà Nẵng",
  },
  {
    name: "Filipino",
    text: "Maligayang pagdating sa aming munting eksibisyon.",
  },
];
