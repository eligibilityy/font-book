import type { Style } from "@shared/contracts/library";
import type {
  Collection,
  CollectionsFile,
  StoredFile,
  StyleRef,
} from "@shared/contracts/storage";
import { useCallback, useMemo } from "react";
import { useSavedFile } from "@/shared/use-saved-file";

export interface Collections {
  favorites: StyleRef[];
  collections: Collection[];
  favoriteIds: ReadonlySet<string>;
  isReadOnly: boolean;
  toggleFavorite: (style: Style) => void;
  removeFavorite: (styleId: string) => void;
  /** Returns the new Collection, or null if the name is taken. */
  createCollection: (name: string) => Collection | null;
  /** Returns false if another Collection already has the name. */
  renameCollection: (id: string, name: string) => boolean;
  deleteCollection: (id: string) => void;
  setInCollection: (
    collectionId: string,
    style: Style,
    isIncluded: boolean,
  ) => void;
  removeFromCollection: (collectionId: string, styleId: string) => void;
  setCollectionNote: (id: string, note: string) => void;
  /** Adds Styles that aren't in the Collection yet, in the order given. */
  addToCollection: (collectionId: string, styles: readonly Style[]) => void;
  isNameTaken: (name: string, exceptId?: string) => boolean;
}

/** The snapshot of names saved with a Style, so a Missing Style keeps its name. */
export function styleRefOf(style: Style): StyleRef {
  return {
    styleId: style.id,
    familyName: style.familyName,
    styleName: style.styleName,
  };
}

/** Favorites and Collections, saved in collections.json. */
export function useCollections(
  stored: StoredFile<CollectionsFile>,
  onSaveFailed: () => void,
): Collections {
  const file = useSavedFile(stored, {
    save: window.fontBook.storage.saveCollections,
    onSaveFailed,
  });
  const { data, update } = file;

  const favoriteIds = useMemo(
    () => new Set(data.favorites.map((ref) => ref.styleId)),
    [data.favorites],
  );

  const isNameTaken = useCallback(
    (name: string, exceptId?: string) => {
      const wanted = name.trim().toLocaleLowerCase();
      return data.collections.some(
        (collection) =>
          collection.id !== exceptId &&
          collection.name.trim().toLocaleLowerCase() === wanted,
      );
    },
    [data.collections],
  );

  const toggleFavorite = useCallback(
    (style: Style) => {
      update((previous) => ({
        ...previous,
        favorites: previous.favorites.some((ref) => ref.styleId === style.id)
          ? previous.favorites.filter((ref) => ref.styleId !== style.id)
          : [...previous.favorites, styleRefOf(style)],
      }));
    },
    [update],
  );

  const removeFavorite = useCallback(
    (styleId: string) => {
      update((previous) => ({
        ...previous,
        favorites: previous.favorites.filter((ref) => ref.styleId !== styleId),
      }));
    },
    [update],
  );

  const createCollection = useCallback(
    (name: string): Collection | null => {
      const trimmed = name.trim();
      if (trimmed === "" || isNameTaken(trimmed) || file.isReadOnly)
        return null;
      const collection: Collection = {
        id: crypto.randomUUID(),
        name: trimmed,
        styles: [],
        note: "",
      };
      update((previous) => ({
        ...previous,
        collections: [...previous.collections, collection],
      }));
      return collection;
    },
    [isNameTaken, update, file.isReadOnly],
  );

  const changeCollection = useCallback(
    (id: string, change: (collection: Collection) => Collection) => {
      update((previous) => ({
        ...previous,
        collections: previous.collections.map((collection) =>
          collection.id === id ? change(collection) : collection,
        ),
      }));
    },
    [update],
  );

  const renameCollection = useCallback(
    (id: string, name: string): boolean => {
      const trimmed = name.trim();
      if (trimmed === "" || isNameTaken(trimmed, id)) return false;
      changeCollection(id, (collection) => ({ ...collection, name: trimmed }));
      return true;
    },
    [isNameTaken, changeCollection],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      update((previous) => ({
        ...previous,
        collections: previous.collections.filter(
          (collection) => collection.id !== id,
        ),
      }));
    },
    [update],
  );

  const setInCollection = useCallback(
    (collectionId: string, style: Style, isIncluded: boolean) => {
      changeCollection(collectionId, (collection) => {
        const without = collection.styles.filter(
          (ref) => ref.styleId !== style.id,
        );
        return {
          ...collection,
          styles: isIncluded ? [...without, styleRefOf(style)] : without,
        };
      });
    },
    [changeCollection],
  );

  const removeFromCollection = useCallback(
    (collectionId: string, styleId: string) => {
      changeCollection(collectionId, (collection) => ({
        ...collection,
        styles: collection.styles.filter((ref) => ref.styleId !== styleId),
      }));
    },
    [changeCollection],
  );

  const setCollectionNote = useCallback(
    (id: string, note: string) => {
      changeCollection(id, (collection) => ({
        ...collection,
        note: note.trim().slice(0, 200),
      }));
    },
    [changeCollection],
  );

  const addToCollection = useCallback(
    (collectionId: string, styles: readonly Style[]) => {
      changeCollection(collectionId, (collection) => {
        const present = new Set(collection.styles.map((ref) => ref.styleId));
        const added = styles
          .filter((style) => !present.has(style.id))
          .map(styleRefOf);
        return { ...collection, styles: [...collection.styles, ...added] };
      });
    },
    [changeCollection],
  );

  return {
    favorites: data.favorites,
    collections: data.collections,
    favoriteIds,
    isReadOnly: file.isReadOnly,
    toggleFavorite,
    removeFavorite,
    createCollection,
    renameCollection,
    deleteCollection,
    setInCollection,
    removeFromCollection,
    addToCollection,
    setCollectionNote,
    isNameTaken,
  };
}
