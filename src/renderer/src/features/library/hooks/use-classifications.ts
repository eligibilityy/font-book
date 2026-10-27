import {
  type Classification,
  guessClassification,
} from "@shared/classification";
import type {
  ClassificationsFile,
  StoredFile,
} from "@shared/contracts/storage";
import { useCallback } from "react";
import { useSavedFile } from "@/shared/use-saved-file";
import type { Family } from "../families";

export interface FamilyClassification {
  classification: Classification;
  /** True when it came from the Font file, false when she set it by hand. */
  isGuess: boolean;
}

export interface Classifications {
  classify(family: Family): FamilyClassification;
  /** `null` goes back to the guess from the Font file. */
  setClassification(
    familyKey: string,
    classification: Classification | null,
  ): void;
  isReadOnly: boolean;
}

/** Hand-set Classifications, saved in classifications.json. */
export function useClassifications(
  stored: StoredFile<ClassificationsFile>,
  onSaveFailed: () => void,
): Classifications {
  const file = useSavedFile(stored, {
    save: window.fontBook.storage.saveClassifications,
    onSaveFailed,
  });
  const { data, update } = file;

  const classify = useCallback(
    (family: Family): FamilyClassification => {
      const chosen = data.families[family.key];
      if (chosen) return { classification: chosen, isGuess: false };
      return {
        classification: guessClassification(family.representative),
        isGuess: true,
      };
    },
    [data],
  );

  const setClassification = useCallback(
    (familyKey: string, classification: Classification | null) => {
      update((previous) => {
        const families = { ...previous.families };
        if (classification === null) delete families[familyKey];
        else families[familyKey] = classification;
        return { ...previous, families };
      });
    },
    [update],
  );

  return { classify, setClassification, isReadOnly: file.isReadOnly };
}
