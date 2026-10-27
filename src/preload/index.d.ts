import type { FontBookApi } from "../shared/contracts/font-book-api";

declare global {
  interface Window {
    fontBook: FontBookApi;
  }
}
