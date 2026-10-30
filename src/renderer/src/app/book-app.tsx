import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { classificationLabels } from "@shared/classification";
import type { AppCommand, AppInfo } from "@shared/contracts/app";
import type { ExportPngResult } from "@shared/contracts/export";
import type { ImportResult, Library, Style } from "@shared/contracts/library";
import {
  DEFAULT_SAMPLE_TEXT,
  type StoredData,
  type StyleRef,
} from "@shared/contracts/storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AddToCollectionPopover,
  CollectionNote,
  styleRefOf,
  useCollections,
} from "@/features/collections";
import { DedicationPage } from "@/features/dedication";
import { exportPaper } from "@/features/export";
import {
  ImportDropZone,
  importMessage,
  installMessage,
} from "@/features/import";
import {
  type ClassificationFilter,
  ClassificationSelect,
  CouldntReadView,
  type Family,
  familyKey,
  findDuplicates,
  groupIntoFamilies,
  installStatus,
  LibraryList,
  type LibraryListHandle,
  type ListRow,
  rowFamily,
  rowStyle,
  useClassifications,
} from "@/features/library";
import {
  assignRole,
  type PairingRole,
  PairingView,
  roleLabels,
} from "@/features/pairing";
import { QuickPreview } from "@/features/quick-preview";
import { type SpecimenSettings, SpecimenView } from "@/features/specimen";
import { useWarmFaces } from "@/shared/font-faces/use-style-face";
import { countOf, formatNumber } from "@/shared/text";
import controls from "@/shared/ui/controls.module.css";
import { useSavedFile } from "@/shared/use-saved-file";
import { RowMenuItems } from "./row-menu";
import { Sidebar } from "./sidebar";
import styles from "./styles.module.css";
import { useToast } from "./toast";
import { Toolbar } from "./toolbar";
import {
  buildRows,
  type Facets,
  hasFacets,
  noFacets,
  showsFamilies,
  type View,
  viewKey,
  viewTitle,
} from "./views";

type Mode =
  | { kind: "list" }
  | {
      kind: "specimen";
      familyKey: string;
      styleId: string;
      /** Opened from the Pairing's header: Back returns there. */
      fromPairing?: boolean;
    }
  | { kind: "missing"; ref: StyleRef }
  | { kind: "pairing" };

const SAVE_FAILED =
  "Couldn't save your change, so it was undone. Try again in a moment.";
const SPECIMEN_SIZES = [
  8, 10, 12, 14, 16, 18, 24, 32, 40, 48, 64, 80, 96, 120, 144, 180, 240, 300,
];

interface BookAppProps {
  library: Library;
  isScanning: boolean;
  stored: StoredData;
  appInfo: AppInfo;
  onScanAgain: () => void;
  /** After an Import, main has Scanned again: show its new Library. */
  onLibraryChange: (library: Library) => void;
}

/** Book, once the Library and the stored files are loaded. */
export function BookApp({
  library,
  isScanning,
  stored,
  appInfo,
  onScanAgain,
  onLibraryChange,
}: BookAppProps): React.JSX.Element {
  const { toast, showToast } = useToast();
  const onSaveFailed = useCallback(() => showToast(SAVE_FAILED), [showToast]);
  const prefs = useSavedFile(stored.prefs, {
    save: window.fontBook.storage.savePrefs,
    onSaveFailed,
    debounceMs: 400,
  });
  const collections = useCollections(stored.collections, onSaveFailed);
  const classifications = useClassifications(
    stored.classifications,
    onSaveFailed,
  );

  const [view, setView] = useState<View>({ kind: "all" });
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string>>({});
  const [searches, setSearches] = useState<Record<string, string>>({});
  const [facetsByView, setFacetsByView] = useState<Record<string, Facets>>({});
  const [filters, setFilters] = useState<Record<string, ClassificationFilter>>(
    {},
  );
  const [quickPreview, setQuickPreview] = useState<{
    open: boolean;
    styleId: string | null;
  }>({
    open: false,
    styleId: null,
  });
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [addToCollection, setAddToCollection] = useState<{
    open: boolean;
    anchor: Element | null;
  }>({
    open: false,
    anchor: null,
  });
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [isPairingFlashing, setIsPairingFlashing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dropTargetCollectionId, setDropTargetCollectionId] = useState<
    string | null
  >(null);
  // Un-starred while looking at Favorites: stays listed until she leaves, so
  // pressing F again undoes a mistake.
  const [unstarred, setUnstarred] = useState<StyleRef[]>([]);
  const [announcement, setAnnouncement] = useState("");
  // The dedication opens by itself the first time, and from About Book after.
  const [dedication, setDedication] = useState(() => ({
    open: !stored.prefs.data.dedicationSeen,
    isFirstTime: !stored.prefs.data.dedicationSeen,
  }));
  const scrollOffsets = useRef<Record<string, number>>({});
  const listRef = useRef<LibraryListHandle | null>(null);
  const specimenRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const key = viewKey(view);
  const search = searches[key] ?? "";
  const filter = filters[key] ?? "any";
  const facets = facetsByView[key] ?? noFacets;
  const settings: SpecimenSettings = {
    size: prefs.data.specimenSize,
    lineHeight: prefs.data.lineHeight,
    tracking: prefs.data.tracking,
    paperReversed: prefs.data.paperReversed,
    inspectorOpen: prefs.data.inspectorOpen,
    layout: prefs.data.specimenLayout,
  };

  // ---------- Derived data ----------

  const familiesByKey = useMemo(
    () =>
      new Map(
        groupIntoFamilies(library.styles).map((family) => [family.key, family]),
      ),
    [library.styles],
  );
  const stylesById = useMemo(
    () => new Map(library.styles.map((style) => [style.id, style])),
    [library.styles],
  );
  const { duplicateFolders, otherCopyFolders } = useMemo(() => {
    const ownLabel = (style: Style) =>
      style.fontFile.folderKind === "system"
        ? "System"
        : style.fontFile.folderKind === "imported"
          ? "Imported"
          : "My Fonts";
    const own = new Map<string, string>();
    const other = new Map<string, string>();
    for (const [id, group] of findDuplicates(library.styles)) {
      const style = group.find((candidate) => candidate.id === id);
      const copy = group.find((candidate) => candidate.id !== id);
      if (style) own.set(id, ownLabel(style));
      if (copy) other.set(id, copy.fontFile.folderPath);
    }
    return { duplicateFolders: own, otherCopyFolders: other };
  }, [library.styles]);

  const activeCollection =
    view.kind === "collection"
      ? (collections.collections.find(
          (collection) => collection.id === view.id,
        ) ?? null)
      : null;
  const refs = useMemo(() => {
    if (view.kind === "favorites") {
      const listed = new Set(collections.favorites.map((ref) => ref.styleId));
      return [
        ...collections.favorites,
        ...unstarred.filter((ref) => !listed.has(ref.styleId)),
      ];
    }
    return activeCollection?.styles ?? [];
  }, [view.kind, collections.favorites, unstarred, activeCollection]);

  const built = useMemo(
    () =>
      buildRows({
        view,
        styles: library.styles,
        familiesByKey,
        refs,
        search,
        classification: filter,
        facets,
        classify: classifications.classify,
      }),
    [
      view,
      library.styles,
      familiesByKey,
      refs,
      search,
      filter,
      facets,
      classifications.classify,
    ],
  );
  const { rows } = built;

  // Every Family, by name, for the Pairing's pickers; and the list she is
  // in, with its search and filters, for stepping a Pairing role through.
  const allFamilies = useMemo(
    () => [...familiesByKey.values()],
    [familiesByKey],
  );
  const pairingCandidates = useMemo(
    () => rows.flatMap((row) => rowStyle(row) ?? []),
    [rows],
  );

  const savedKey = selectedKeys[key];
  const foundIndex =
    savedKey === undefined ? -1 : rows.findIndex((row) => row.key === savedKey);
  const selectedIndex = foundIndex >= 0 ? foundIndex : rows.length > 0 ? 0 : -1;
  const selectedRow: ListRow | null = rows[selectedIndex] ?? null;

  const quickPreviewStyle = useMemo((): Style | null => {
    if (!selectedRow) return null;
    const family = rowFamily(selectedRow);
    if (selectedRow.kind === "family" && family && quickPreview.styleId) {
      return (
        family.styles.find((style) => style.id === quickPreview.styleId) ??
        rowStyle(selectedRow)
      );
    }
    return rowStyle(selectedRow);
  }, [selectedRow, quickPreview.styleId]);

  // While Quick preview is open, load the rows above and below too, so Up and
  // Down land on a Style that is already drawn.
  useWarmFaces(
    quickPreview.open
      ? [rows[selectedIndex - 1], rows[selectedIndex + 1]].map((row) =>
          row ? rowStyle(row) : null,
        )
      : [],
  );

  const specimenFamily: Family | null =
    mode.kind === "specimen"
      ? (familiesByKey.get(mode.familyKey) ?? null)
      : null;
  const specimenStyle: Style | null =
    mode.kind === "specimen" && specimenFamily
      ? (specimenFamily.styles.find((style) => style.id === mode.styleId) ??
        specimenFamily.representative)
      : null;

  // After a Scan Again, a Specimen whose Family vanished goes back to the list.
  useEffect(() => {
    if (mode.kind === "specimen" && !specimenFamily) setMode({ kind: "list" });
  }, [mode.kind, specimenFamily]);

  // ---------- Focus: the list, or the Specimen, whichever is showing ----------

  // (The list focuses itself whenever it mounts: on launch, on each view, on Back.)
  const modeKind = mode.kind;
  useEffect(() => {
    if (modeKind !== "list") specimenRef.current?.focus();
  }, [modeKind]);

  // ---------- Actions ----------

  const changeView = useCallback((next: View) => {
    setView(next);
    setMode({ kind: "list" });
    setUnstarred([]);
    setQuickPreview({ open: false, styleId: null });
    // Choosing a view hands the keyboard to its list, even when it is the
    // view already showing (the list doesn't remount then).
    requestAnimationFrame(() => listRef.current?.focus());
  }, []);

  const select = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return;
      setSelectedKeys((previous) => ({ ...previous, [key]: row.key }));
      setQuickPreview((previous) => ({ ...previous, styleId: null }));
    },
    [rows, key],
  );

  const openRow = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return;
      setQuickPreview({ open: false, styleId: null });
      if (row.kind === "missing") {
        setMode({ kind: "missing", ref: row.ref });
        return;
      }
      const style =
        row.kind === "family"
          ? (row.family.styles.find(
              (candidate) => candidate.id === quickPreview.styleId,
            ) ?? row.family.representative)
          : row.style;
      setMode({
        kind: "specimen",
        familyKey: row.family.key,
        styleId: style.id,
      });
    },
    [rows, quickPreview.styleId],
  );

  const goBack = useCallback(
    () =>
      setMode((current) =>
        current.kind === "specimen" && current.fromPairing
          ? { kind: "pairing" }
          : { kind: "list" },
      ),
    [],
  );
  const openPairing = useCallback(() => {
    setQuickPreview({ open: false, styleId: null });
    setMode({ kind: "pairing" });
  }, []);
  const closeQuickPreview = useCallback(
    () => setQuickPreview({ open: false, styleId: null }),
    [],
  );

  const toggleQuickPreview = useCallback(() => {
    if (!selectedRow) return;
    setQuickPreview((previous) => ({
      open: !previous.open,
      styleId: previous.styleId,
    }));
    if (!prefs.data.firstLaunchHintSeen) {
      prefs.update((previous) => ({ ...previous, firstLaunchHintSeen: true }));
    }
    if (quickPreviewStyle) {
      setAnnouncement(
        `Quick preview, ${quickPreviewStyle.familyName} ${quickPreviewStyle.styleName}`,
      );
    }
  }, [selectedRow, prefs, quickPreviewStyle]);

  const stepQuickPreview = useCallback(
    (delta: number) => {
      if (selectedRow?.kind !== "family" || !quickPreviewStyle) return;
      const familyStyles = selectedRow.family.styles;
      const index = familyStyles.findIndex(
        (style) => style.id === quickPreviewStyle.id,
      );
      const next =
        familyStyles[
          (index + delta + familyStyles.length) % familyStyles.length
        ];
      if (next) {
        setQuickPreview({ open: true, styleId: next.id });
        setAnnouncement(`Quick preview, ${next.familyName} ${next.styleName}`);
      }
    },
    [selectedRow, quickPreviewStyle],
  );

  /**
   * The Style the organize actions apply to: one she can see. The Specimen's,
   * the one Quick preview shows, or a Style row's.
   */
  const targetStyle: Style | null =
    mode.kind === "specimen"
      ? specimenStyle
      : quickPreview.open && selectedRow?.kind !== "missing"
        ? quickPreviewStyle
        : selectedRow?.kind === "style"
          ? selectedRow.style
          : null;

  const toggleFavorite = useCallback(() => {
    if (collections.isReadOnly) return;
    if (!targetStyle) {
      if (
        mode.kind === "list" &&
        selectedRow?.kind === "missing" &&
        collections.favoriteIds.has(selectedRow.key)
      ) {
        collections.removeFavorite(selectedRow.key);
      } else if (mode.kind === "list" && selectedRow?.kind === "family") {
        showToast("Press Space or open the Specimen to choose a Style.");
      }
      return;
    }
    const wasFavorite = collections.favoriteIds.has(targetStyle.id);
    if (wasFavorite && view.kind === "favorites") {
      setUnstarred((previous) => [...previous, styleRefOf(targetStyle)]);
    }
    collections.toggleFavorite(targetStyle);
    setAnnouncement(
      wasFavorite ? "Removed from Favorites" : "Added to Favorites",
    );
  }, [collections, targetStyle, mode.kind, selectedRow, view.kind, showToast]);

  const openAddToCollection = useCallback(() => {
    if (!targetStyle || collections.isReadOnly) return;
    const anchor =
      mode.kind === "list"
        ? document.querySelector('[role="option"][aria-selected="true"]')
        : null;
    setAddToCollection({ open: true, anchor });
  }, [targetStyle, collections.isReadOnly, mode.kind]);

  const collectionsRef = useRef(collections.collections);
  collectionsRef.current = collections.collections;
  const flashCollection = useCallback((collectionId: string) => {
    setRecentlyAddedId(collectionId);
    const name = collectionsRef.current.find(
      (collection) => collection.id === collectionId,
    )?.name;
    if (name) setAnnouncement(`Added to ${name}`);
    // Clearing the attribute lets the row's 280ms fade-out run.
    setTimeout(
      () =>
        setRecentlyAddedId((current) =>
          current === collectionId ? null : current,
        ),
      50,
    );
  }, []);

  const putInPairing = useCallback(
    (role: PairingRole, style: Style, axisValues: Record<string, number>) => {
      prefs.update((previous) => ({
        ...previous,
        pairing: assignRole(
          previous.pairing,
          role,
          styleRefOf(style),
          axisValues,
        ),
      }));
      setAnnouncement(
        `${style.familyName} ${style.styleName} is the ${roleLabels[role]} in the Pairing`,
      );
      // The sidebar's Pairing row tints, then fades: where the Style went.
      setIsPairingFlashing(true);
      setTimeout(() => setIsPairingFlashing(false), 50);
    },
    [prefs],
  );

  /**
   * Imports, then shows what arrived: the Imported view with the first new
   * Family selected, or the Collection she dropped onto with them added.
   */
  const runImport = async (
    request: () => Promise<ImportResult>,
    collectionId: string | null,
  ): Promise<void> => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const result = await request();
      if (result.status === "cancelled") return;
      onLibraryChange(result.library);
      const { summary } = result;
      const byId = new Map(
        result.library.styles.map((style) => [style.id, style]),
      );
      const imported = summary.styleIds.flatMap((id) => {
        const style = byId.get(id);
        return style ? [style] : [];
      });
      const collection =
        collectionId && !collections.isReadOnly
          ? (collections.collections.find(
              (candidate) => candidate.id === collectionId,
            ) ?? null)
          : null;
      const first = imported[0];
      if (collection && imported.length > 0) {
        collections.addToCollection(collection.id, imported);
        flashCollection(collection.id);
        changeView({ kind: "collection", id: collection.id });
      } else if (first) {
        changeView({ kind: "imported" });
        setSelectedKeys((previous) => ({
          ...previous,
          [viewKey({ kind: "imported" })]: familyKey(first.familyName),
        }));
      }
      showToast(importMessage(summary, collection?.name ?? null));
    } catch (error) {
      console.error("Import failed", error);
      showToast("Book couldn't Import those files. Try again in a moment.");
    } finally {
      setIsImporting(false);
    }
  };

  /** Install or Uninstall a row's Imported Styles, then says what changed. */
  const runInstall = async (
    action: "install" | "uninstall",
    styles: readonly Style[],
  ): Promise<void> => {
    const ids = styles.map((style) => style.id);
    if (ids.length === 0) return;
    try {
      const result =
        action === "install"
          ? await window.fontBook.library.install(ids)
          : await window.fontBook.library.uninstall(ids);
      onLibraryChange(result.library);
      showToast(installMessage(action, result.summary));
    } catch (error) {
      console.error(`${action} failed`, error);
      showToast(
        `Book couldn't ${action === "install" ? "Install" : "Uninstall"} those Font files. Try again in a moment.`,
      );
    }
  };

  /** Export PNG of the Specimen or the Pairing, as it looks now. */
  const exportCurrent = async (): Promise<void> => {
    const { heading, body } = prefs.data.pairing;
    const name =
      mode.kind === "specimen" && specimenStyle
        ? `${specimenStyle.familyName} ${specimenStyle.styleName}`
        : mode.kind === "pairing"
          ? [heading.style, body.style]
              .flatMap((ref) =>
                ref ? [`${ref.familyName} ${ref.styleName}`] : [],
              )
              .join(" and ")
          : "";
    if (name === "") {
      showToast("Open a Specimen or the Pairing to Export a PNG.");
      return;
    }
    const result = await exportPaper(name).catch(
      (): ExportPngResult => ({ status: "failed" }),
    );
    if (!result || result.status === "cancelled") return;
    showToast(
      result.status === "saved"
        ? `Exported "${result.fileName}", ${formatNumber(result.width)} by ${formatNumber(result.height)} pixels.`
        : "Book couldn't save the PNG. Try another folder.",
    );
  };

  const showInFolder = useCallback((style: Style) => {
    void window.fontBook.library.showInFolder({
      kind: "style",
      styleId: style.id,
    });
  }, []);

  const updateSettings = useCallback(
    (changes: Partial<SpecimenSettings>) => {
      prefs.update((previous) => ({
        ...previous,
        specimenSize: changes.size ?? previous.specimenSize,
        lineHeight: changes.lineHeight ?? previous.lineHeight,
        tracking: changes.tracking ?? previous.tracking,
        paperReversed: changes.paperReversed ?? previous.paperReversed,
        inspectorOpen: changes.inspectorOpen ?? previous.inspectorOpen,
        specimenLayout: changes.layout ?? previous.specimenLayout,
      }));
    },
    [prefs],
  );

  const setSampleText = useCallback(
    (sampleText: string) =>
      prefs.update((previous) => ({ ...previous, sampleText })),
    [prefs],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearches((previous) => ({ ...previous, [key]: value }));
      // The first match becomes the selection.
      setSelectedKeys((previous) => {
        const { [key]: _removed, ...rest } = previous;
        return rest;
      });
      setMode({ kind: "list" });
    },
    [key],
  );

  // ---------- Menu commands ----------

  const handleCommand = (command: AppCommand) => {
    const inList = mode.kind === "list";
    switch (command) {
      case "scan-again":
        return onScanAgain();
      case "import":
        void runImport(window.fontBook.library.importWithDialog, null);
        return;
      case "find":
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      case "new-collection":
        if (!prefs.data.sidebarVisible)
          prefs.update((previous) => ({ ...previous, sidebarVisible: true }));
        setIsCreatingCollection(true);
        return;
      case "toggle-sidebar":
        return prefs.update((previous) => ({
          ...previous,
          sidebarVisible: !previous.sidebarVisible,
        }));
      case "toggle-inspector":
        return updateSettings({ inspectorOpen: !settings.inspectorOpen });
      case "reverse-paper-and-ink":
        return updateSettings({ paperReversed: !settings.paperReversed });
      case "size-bigger":
        return updateSettings({
          size: SPECIMEN_SIZES.find((size) => size > settings.size) ?? 300,
        });
      case "size-smaller":
        return updateSettings({
          size:
            [...SPECIMEN_SIZES]
              .reverse()
              .find((size) => size < settings.size) ?? 8,
        });
      case "size-default":
        return updateSettings({ size: 64 });
      case "reset-sample-text":
        return setSampleText(DEFAULT_SAMPLE_TEXT);
      case "go-back":
        return goBack();
      case "go-all":
        return changeView({ kind: "all" });
      case "go-my-fonts":
        return changeView({ kind: "my-fonts" });
      case "go-system":
        return changeView({ kind: "system" });
      case "go-imported":
        return changeView({ kind: "imported" });
      case "go-favorites":
        return changeView({ kind: "favorites" });
      case "go-pairing":
        return openPairing();
      case "use-as-heading":
      case "use-as-body": {
        const style =
          mode.kind === "specimen"
            ? specimenStyle
            : inList
              ? quickPreviewStyle
              : null;
        if (style)
          putInPairing(
            command === "use-as-heading" ? "heading" : "body",
            style,
            {},
          );
        return;
      }
      case "open-specimen":
        if (inList && selectedIndex >= 0) openRow(selectedIndex);
        return;
      case "quick-preview":
        if (inList) toggleQuickPreview();
        return;
      case "toggle-favorite":
        return toggleFavorite();
      case "add-to-collection":
        return openAddToCollection();
      case "export-png":
        void exportCurrent();
        return;
      case "show-in-folder": {
        const style =
          mode.kind === "specimen"
            ? specimenStyle
            : selectedRow
              ? rowStyle(selectedRow)
              : null;
        if (style) showInFolder(style);
        return;
      }
      case "show-about":
        setDedication({ open: true, isFirstTime: false });
        return;
    }
  };
  const commandRef = useRef(handleCommand);
  commandRef.current = handleCommand;
  useEffect(
    () =>
      window.fontBook.app.onCommand((command) => commandRef.current(command)),
    [],
  );

  // ---------- Rendering ----------

  const title = viewTitle(view, collections.collections);
  const selectedFamily = selectedRow ? rowFamily(selectedRow) : null;
  // What Install acts on: the whole Family on a Family row.
  const selectedRowStyles =
    selectedRow?.kind === "family"
      ? selectedRow.family.styles
      : selectedRow?.kind === "style"
        ? [selectedRow.style]
        : [];

  return (
    <div
      className={styles.shell}
      data-sidebar={prefs.data.sidebarVisible ? "" : undefined}
    >
      {prefs.data.sidebarVisible && (
        <Sidebar
          view={view}
          onViewChange={changeView}
          failedCount={library.failed.length}
          collections={collections}
          isCreatingCollection={isCreatingCollection}
          onCreatingCollectionChange={setIsCreatingCollection}
          recentlyAddedId={recentlyAddedId}
          isPairingOpen={mode.kind === "pairing"}
          onOpenPairing={openPairing}
          isPairingFlashing={isPairingFlashing}
          dropTargetCollectionId={dropTargetCollectionId}
        />
      )}
      <div className={styles.content}>
        <Toolbar
          sidebarVisible={prefs.data.sidebarVisible}
          onToggleSidebar={() =>
            prefs.update((previous) => ({
              ...previous,
              sidebarVisible: !previous.sidebarVisible,
            }))
          }
          backLabel={
            mode.kind === "list"
              ? null
              : mode.kind === "specimen" && mode.fromPairing
                ? "Pairing"
                : title
          }
          onBack={goBack}
          search={search}
          searchPlaceholder={`Search ${title}`}
          onSearchChange={setSearch}
          onSearchExit={() => listRef.current?.focus()}
          searchRef={searchRef}
          sampleText={prefs.data.sampleText}
          onSampleTextChange={setSampleText}
        />
        <main className={styles.main}>
          {mode.kind === "specimen" && specimenFamily && specimenStyle ? (
            <SpecimenView
              styles={specimenFamily.styles}
              style={specimenStyle}
              familyName={specimenFamily.name}
              onStyleChange={(style) =>
                setMode((current) => ({
                  kind: "specimen",
                  familyKey: specimenFamily.key,
                  styleId: style.id,
                  fromPairing:
                    current.kind === "specimen" && current.fromPairing === true,
                }))
              }
              sampleText={prefs.data.sampleText}
              onSampleTextChange={setSampleText}
              settings={settings}
              onSettingsChange={updateSettings}
              classification={
                classifications.classify(specimenFamily).classification
              }
              isClassificationGuess={
                classifications.classify(specimenFamily).isGuess
              }
              onClassificationChange={(value) =>
                classifications.setClassification(specimenFamily.key, value)
              }
              isFavorite={collections.favoriteIds.has(specimenStyle.id)}
              onToggleFavorite={toggleFavorite}
              renderAddToCollection={(trigger) => (
                <AddToCollectionPopover
                  style={specimenStyle}
                  collections={collections}
                  open={addToCollection.open}
                  onOpenChange={(open) =>
                    setAddToCollection({ open, anchor: null })
                  }
                  trigger={trigger}
                  onAdded={flashCollection}
                />
              )}
              duplicateFolders={duplicateFolders}
              otherCopyFolders={otherCopyFolders}
              fileManagerName={appInfo.fileManagerName}
              onShowInFolder={showInFolder}
              onUseAs={(role, axisValues) =>
                putInPairing(role, specimenStyle, axisValues)
              }
              onOpenPairing={openPairing}
              pairingRole={
                prefs.data.pairing.heading.style?.styleId === specimenStyle.id
                  ? "heading"
                  : prefs.data.pairing.body.style?.styleId === specimenStyle.id
                    ? "body"
                    : null
              }
              onExport={() => void exportCurrent()}
              onBack={goBack}
              regionRef={specimenRef}
            />
          ) : mode.kind === "pairing" ? (
            <PairingView
              pairing={prefs.data.pairing}
              onPairingChange={(change) =>
                prefs.update((previous) => ({
                  ...previous,
                  pairing: change(previous.pairing),
                }))
              }
              stylesById={stylesById}
              families={allFamilies}
              familyOf={(style) =>
                familiesByKey.get(familyKey(style.familyName))
              }
              candidates={pairingCandidates}
              candidatesLabel={`${countOf(
                pairingCandidates.length,
                showsFamilies(view) ? "Family" : "Style",
                showsFamilies(view) ? "Families" : "Styles",
              )} in ${title}`}
              sampleText={prefs.data.sampleText}
              paperReversed={settings.paperReversed}
              onPaperReversedChange={(paperReversed) =>
                updateSettings({ paperReversed })
              }
              inspectorOpen={settings.inspectorOpen}
              onInspectorOpenChange={(inspectorOpen) =>
                updateSettings({ inspectorOpen })
              }
              onOpenSpecimen={(style) =>
                setMode({
                  kind: "specimen",
                  familyKey: familyKey(style.familyName),
                  styleId: style.id,
                  fromPairing: true,
                })
              }
              onExport={() => void exportCurrent()}
              onBack={goBack}
              regionRef={specimenRef}
            />
          ) : mode.kind === "missing" ? (
            <MissingSpecimen
              styleRef={mode.ref}
              collectionName={activeCollection?.name ?? null}
              isFavorite={collections.favoriteIds.has(mode.ref.styleId)}
              onRemove={() => {
                if (activeCollection)
                  collections.removeFromCollection(
                    activeCollection.id,
                    mode.ref.styleId,
                  );
                else collections.removeFavorite(mode.ref.styleId);
                goBack();
              }}
              onBack={goBack}
              regionRef={specimenRef}
            />
          ) : (
            <section className={styles.listArea} aria-label={title}>
              <header className={styles.listHeader}>
                <h1 className={styles.listTitle}>{title}</h1>
                {activeCollection && (
                  <CollectionNote
                    collectionName={activeCollection.name}
                    note={activeCollection.note}
                    isReadOnly={collections.isReadOnly}
                    onChange={(note) =>
                      collections.setCollectionNote(activeCollection.id, note)
                    }
                  />
                )}
                {view.kind !== "couldnt-read" && (
                  <ClassificationSelect
                    value={filter}
                    counts={built.counts}
                    onChange={(value) => {
                      setFilters((previous) => ({ ...previous, [key]: value }));
                      setSelectedKeys((previous) => {
                        const { [key]: _removed, ...rest } = previous;
                        return rest;
                      });
                    }}
                  />
                )}
                {view.kind !== "couldnt-read" && (
                  <ToggleGroup
                    className={controls.segmented}
                    aria-label="Filters"
                    multiple
                    value={[
                      ...(facets.variable ? ["variable"] : []),
                      ...(facets.italics ? ["italics"] : []),
                    ]}
                    onValueChange={(value) => {
                      setFacetsByView((previous) => ({
                        ...previous,
                        [key]: {
                          variable: value.includes("variable"),
                          italics: value.includes("italics"),
                        },
                      }));
                      setSelectedKeys((previous) => {
                        const { [key]: _removed, ...rest } = previous;
                        return rest;
                      });
                    }}
                  >
                    <Toggle value="variable" className={controls.segment}>
                      Variable
                    </Toggle>
                    <Toggle value="italics" className={controls.segment}>
                      Has Italics
                    </Toggle>
                  </ToggleGroup>
                )}
                <p className={styles.listCount} aria-live="polite">
                  {isScanning
                    ? "Scanning..."
                    : listCount(
                        view,
                        library,
                        rows.length,
                        built.total,
                        search,
                        filter !== "any" || hasFacets(facets),
                      )}
                </p>
                {!prefs.data.firstLaunchHintSeen && rows.length > 0 && (
                  <p className={styles.hint}>
                    Space for Quick preview. Enter to open.
                  </p>
                )}
              </header>

              <FolderNotices library={library} show={showsFamilies(view)} />

              <div className={styles.listBody}>
                {view.kind === "couldnt-read" ? (
                  <CouldntReadView
                    failed={library.failed}
                    fileManagerName={appInfo.fileManagerName}
                    onShowInFolder={(entry) =>
                      void window.fontBook.library.showInFolder({
                        kind: "failed",
                        path: entry.path,
                      })
                    }
                  />
                ) : rows.length === 0 ? (
                  <EmptyView
                    view={view}
                    library={library}
                    title={title}
                    search={search}
                    filter={filter}
                    facets={facets}
                    onClearSearch={() => setSearch("")}
                    onShowAll={() => {
                      setFilters((previous) => ({ ...previous, [key]: "any" }));
                      setFacetsByView((previous) => ({
                        ...previous,
                        [key]: noFacets,
                      }));
                    }}
                    onScanAgain={onScanAgain}
                  />
                ) : (
                  <LibraryList
                    key={key}
                    rows={rows}
                    label={title}
                    selectedIndex={selectedIndex}
                    favoriteIds={collections.favoriteIds}
                    isQuickPreviewOpen={quickPreview.open}
                    onSelect={select}
                    onOpen={openRow}
                    onToggleQuickPreview={toggleQuickPreview}
                    onCloseQuickPreview={closeQuickPreview}
                    onFocusLeave={closeQuickPreview}
                    onStepQuickPreview={stepQuickPreview}
                    onToggleFavorite={toggleFavorite}
                    onUseAs={(role) => {
                      if (quickPreviewStyle)
                        putInPairing(role, quickPreviewStyle, {});
                    }}
                    initialScrollOffset={scrollOffsets.current[key] ?? 0}
                    onScrollOffsetChange={(offset) => {
                      scrollOffsets.current[key] = offset;
                    }}
                    listRef={listRef}
                    contextMenuItems={
                      <RowMenuItems
                        row={selectedRow}
                        isFavorite={
                          selectedRow
                            ? collections.favoriteIds.has(
                                selectedRow.kind === "family"
                                  ? ""
                                  : selectedRow.key,
                              )
                            : false
                        }
                        isInCollectionView={view.kind === "collection"}
                        classification={
                          selectedFamily
                            ? classifications.classify(selectedFamily)
                            : null
                        }
                        fileManagerName={appInfo.fileManagerName}
                        isReadOnly={collections.isReadOnly}
                        onOpenSpecimen={() => openRow(selectedIndex)}
                        onQuickPreview={toggleQuickPreview}
                        onToggleFavorite={toggleFavorite}
                        onAddToCollection={openAddToCollection}
                        onRemoveFromCollection={() => {
                          if (activeCollection && selectedRow) {
                            collections.removeFromCollection(
                              activeCollection.id,
                              selectedRow.key,
                            );
                          }
                        }}
                        onSetClassification={(value) => {
                          if (selectedFamily)
                            classifications.setClassification(
                              selectedFamily.key,
                              value,
                            );
                        }}
                        onUseAs={(role) => {
                          if (quickPreviewStyle)
                            putInPairing(role, quickPreviewStyle, {});
                        }}
                        onShowInFolder={() => {
                          const style = selectedRow
                            ? rowStyle(selectedRow)
                            : null;
                          if (style) showInFolder(style);
                        }}
                        installStatus={
                          appInfo.canInstall
                            ? installStatus(selectedRowStyles)
                            : null
                        }
                        onInstall={() =>
                          void runInstall("install", selectedRowStyles)
                        }
                        onUninstall={() =>
                          void runInstall("uninstall", selectedRowStyles)
                        }
                      />
                    }
                  />
                )}
                <QuickPreview
                  open={quickPreview.open && selectedRow !== null}
                  style={quickPreviewStyle}
                  fallbackTitle={
                    selectedRow?.kind === "missing"
                      ? `${selectedRow.ref.familyName} ${selectedRow.ref.styleName}`
                      : ""
                  }
                  familyStyles={
                    selectedRow?.kind === "family"
                      ? selectedRow.family.styles
                      : null
                  }
                  sampleText={prefs.data.sampleText}
                  lineHeight={settings.lineHeight}
                  tracking={settings.tracking}
                  paperReversed={settings.paperReversed}
                  onStep={stepQuickPreview}
                  isFavorite={
                    quickPreviewStyle !== null &&
                    collections.favoriteIds.has(quickPreviewStyle.id)
                  }
                  onToggleFavorite={
                    collections.isReadOnly ? null : toggleFavorite
                  }
                  onOpenSpecimen={() => openRow(selectedIndex)}
                  onClose={closeQuickPreview}
                />
              </div>
              {mode.kind === "list" && targetStyle && (
                <AddToCollectionPopover
                  style={targetStyle}
                  collections={collections}
                  open={addToCollection.open}
                  onOpenChange={(open) =>
                    setAddToCollection({ open, anchor: null })
                  }
                  anchor={addToCollection.anchor}
                  onAdded={flashCollection}
                />
              )}
            </section>
          )}
        </main>
      </div>
      <ImportDropZone
        collectionNames={
          new Map(
            collections.collections.map((collection) => [
              collection.id,
              collection.name,
            ]),
          )
        }
        isImporting={isImporting}
        onDropTargetChange={setDropTargetCollectionId}
        onDrop={(files, collectionId) =>
          void runImport(
            () => window.fontBook.library.importFiles(files),
            collectionId,
          )
        }
      />
      <DedicationPage
        open={dedication.open}
        isFirstTime={dedication.isFirstTime}
        version={appInfo.version}
        onClose={() => {
          setDedication((previous) => ({ ...previous, open: false }));
          if (!prefs.data.dedicationSeen) {
            prefs.update((previous) => ({ ...previous, dedicationSeen: true }));
          }
        }}
      />
      {toast}
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function listCount(
  view: View,
  library: Library,
  shown: number,
  total: number,
  search: string,
  isFiltered: boolean,
): string {
  if (view.kind === "couldnt-read")
    return countOf(library.failed.length, "Font file", "Font files");
  const [one, many] = showsFamilies(view)
    ? ["Family", "Families"]
    : ["Style", "Styles"];
  if (search.trim() !== "" || isFiltered) {
    return `${formatNumber(shown)} of ${countOf(total, one, many)}`;
  }
  if (view.kind === "all") {
    return `${countOf(total, one, many)}, ${countOf(library.styles.length, "Style", "Styles")}`;
  }
  return countOf(total, one, many);
}

function FolderNotices({
  library,
  show,
}: {
  library: Library;
  show: boolean;
}): React.JSX.Element | null {
  if (!show) return null;
  const unreadable = [
    ...library.folders
      .filter((report) => report.status === "unreadable")
      .map((report) => report.folder.path),
    ...library.unreadableSubfolders,
  ];
  if (unreadable.length === 0) return null;
  return (
    <ul className={styles.notices}>
      {unreadable.map((path) => (
        <li key={path}>
          Book couldn't read <span className={styles.path}>{path}</span>. Check
          its permissions, then choose Scan Again.
        </li>
      ))}
    </ul>
  );
}

function EmptyView({
  view,
  library,
  title,
  search,
  filter,
  facets,
  onClearSearch,
  onShowAll,
  onScanAgain,
}: {
  view: View;
  library: Library;
  title: string;
  search: string;
  filter: ClassificationFilter;
  facets: Facets;
  onClearSearch: () => void;
  onShowAll: () => void;
  onScanAgain: () => void;
}): React.JSX.Element {
  const unit = showsFamilies(view) ? "Families" : "Styles";
  if (search.trim() !== "") {
    return (
      <div className={styles.empty}>
        <p>
          No {unit} match "{search.trim()}".
        </p>
        <button
          type="button"
          className={controls.button}
          onClick={onClearSearch}
        >
          Clear Search
        </button>
      </div>
    );
  }
  if (hasFacets(facets)) {
    return (
      <div className={styles.empty}>
        <p>
          No {unit} in {title} match these filters.
        </p>
        <button type="button" className={controls.button} onClick={onShowAll}>
          Clear Filters
        </button>
      </div>
    );
  }
  if (filter !== "any") {
    return (
      <div className={styles.empty}>
        <p>
          No {classificationLabels[filter]} Families in {title}.
        </p>
        <button type="button" className={controls.button} onClick={onShowAll}>
          Show All Classifications
        </button>
      </div>
    );
  }
  if (view.kind === "favorites") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No Favorites yet.</p>
        <p>Star a Style to keep it close.</p>
      </div>
    );
  }
  if (view.kind === "collection") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Nothing in {title} yet.</p>
        <p>
          Open a Style and choose Add to Collection, or drop Font files on{" "}
          {title} in the sidebar.
        </p>
      </div>
    );
  }
  if (view.kind === "imported") {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Nothing Imported yet.</p>
        <p>
          Drop Font files or a folder anywhere in Book, or choose File &gt;
          Import. Book keeps its own copy, so a class download can be deleted
          afterwards.
        </p>
      </div>
    );
  }
  if (library.styles.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No Styles found yet.</p>
        <p>
          Drop Font files anywhere in Book to Import them, or put them in your
          Fonts folder and choose Scan Again.
        </p>
        <p>Book looked in:</p>
        <ul className={styles.folderList}>
          {library.folders.map((report) => (
            <li key={report.folder.path} className={styles.path}>
              {report.folder.path}
            </li>
          ))}
        </ul>
        <button type="button" className={controls.button} onClick={onScanAgain}>
          Scan Again
        </button>
      </div>
    );
  }
  return (
    <div className={styles.empty}>
      <p>No Families in {title}.</p>
    </div>
  );
}

function MissingSpecimen({
  styleRef,
  collectionName,
  isFavorite,
  onRemove,
  onBack,
  regionRef,
}: {
  styleRef: StyleRef;
  collectionName: string | null;
  isFavorite: boolean;
  onRemove: () => void;
  onBack: () => void;
  regionRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element {
  return (
    <section
      ref={regionRef}
      tabIndex={-1}
      className={styles.missing}
      aria-label={`${styleRef.familyName} ${styleRef.styleName}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onBack();
      }}
    >
      <h1 className={styles.emptyTitle}>
        {styleRef.familyName} {styleRef.styleName}
      </h1>
      <p>
        This Style's Font file is no longer in your Font folders. It may have
        been moved or removed.
      </p>
      {(collectionName || isFavorite) && (
        <button type="button" className={controls.button} onClick={onRemove}>
          {collectionName ? "Remove from Collection" : "Remove from Favorites"}
        </button>
      )}
    </section>
  );
}
