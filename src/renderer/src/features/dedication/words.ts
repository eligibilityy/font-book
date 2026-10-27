/**
 * The dedication. This is the only file with these words, so they can change
 * without touching anything else.
 */

import signature from "./assets/signature.svg";

interface Dedication {
  to: string;
  message: string;
  /** Shown small, under the message. */
  number: string;
  /**
   * A signature as an SVG file in ./assets, imported here, or null until
   * there is one. Any colour works: the page draws it in its own ink.
   */
  signature: string | null;
}

export const dedication: Dedication = {
  to: "Pau",
  message:
    //   is a non-breaking space: it keeps ":)" and "I love" from being split across lines.
    "I wanted to try and create a font book so you can look through all the specimens you have :) I love you!",
  number: "252628",
  signature,
};
