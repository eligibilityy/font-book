import { ContextMenu } from "@base-ui/react/context-menu";
import {
  type Classification,
  classificationLabels,
  classifications,
} from "@shared/classification";
import type {
  FamilyClassification,
  InstallStatus,
  ListRow,
} from "@/features/library";
import controls from "@/shared/ui/controls.module.css";
import { CheckIcon, ChevronRightIcon } from "@/shared/ui/icons";

interface RowMenuItemsProps {
  row: ListRow | null;
  isFavorite: boolean;
  isInCollectionView: boolean;
  classification: FamilyClassification | null;
  fileManagerName: string;
  isReadOnly: boolean;
  onOpenSpecimen: () => void;
  onQuickPreview: () => void;
  onToggleFavorite: () => void;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
  onSetClassification: (classification: Classification | null) => void;
  /** On a Family row, the Style Quick preview shows, else its Representative Style. */
  onUseAs: (role: "heading" | "body") => void;
  onShowInFolder: () => void;
  /** Null where Book can't Install (Windows). */
  installStatus: InstallStatus | null;
  onInstall: () => void;
  onUninstall: () => void;
}

const GUESS = "guess";

/** The right-click menu for the selected Library row. */
export function RowMenuItems({
  row,
  isFavorite,
  isInCollectionView,
  classification,
  fileManagerName,
  isReadOnly,
  onOpenSpecimen,
  onQuickPreview,
  onToggleFavorite,
  onAddToCollection,
  onRemoveFromCollection,
  onSetClassification,
  onUseAs,
  onShowInFolder,
  installStatus,
  onInstall,
  onUninstall,
}: RowMenuItemsProps): React.JSX.Element | null {
  if (!row) return null;
  const isStyleRow = row.kind === "style";
  const isMissing = row.kind === "missing";

  return (
    <>
      <ContextMenu.Item className={controls.item} onClick={onOpenSpecimen}>
        <span className={controls.itemLabel}>Open Specimen</span>
      </ContextMenu.Item>
      <ContextMenu.Item
        className={controls.item}
        disabled={isMissing}
        onClick={onQuickPreview}
      >
        <span className={controls.itemLabel}>Quick Preview</span>
        <span className={controls.itemHint}>Space</span>
      </ContextMenu.Item>
      <ContextMenu.Separator className={controls.separator} />
      {(isStyleRow || (isMissing && isFavorite)) && (
        <ContextMenu.Item
          className={controls.item}
          disabled={isReadOnly}
          onClick={onToggleFavorite}
        >
          <span className={controls.itemLabel}>
            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </span>
        </ContextMenu.Item>
      )}
      {isStyleRow && (
        <ContextMenu.Item
          className={controls.item}
          disabled={isReadOnly}
          onClick={onAddToCollection}
        >
          <span className={controls.itemLabel}>Add to Collection...</span>
        </ContextMenu.Item>
      )}
      {isInCollectionView && (
        <ContextMenu.Item
          className={controls.item}
          disabled={isReadOnly}
          onClick={onRemoveFromCollection}
        >
          <span className={controls.itemLabel}>Remove from Collection</span>
        </ContextMenu.Item>
      )}
      {classification && (
        <ContextMenu.SubmenuRoot>
          <ContextMenu.SubmenuTrigger className={controls.item}>
            <span className={controls.itemLabel}>Set Classification</span>
            <ChevronRightIcon />
          </ContextMenu.SubmenuTrigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner
              className={controls.positioner}
              sideOffset={-4}
              alignOffset={-4}
            >
              <ContextMenu.Popup className={controls.contextPopup}>
                <ContextMenu.RadioGroup
                  value={
                    classification.isGuess
                      ? GUESS
                      : classification.classification
                  }
                  onValueChange={(value) => {
                    if (value === GUESS) onSetClassification(null);
                    const chosen = classifications.find(
                      (option) => option === value,
                    );
                    if (chosen) onSetClassification(chosen);
                  }}
                >
                  {classifications.map((option) => (
                    <ContextMenu.RadioItem
                      key={option}
                      value={option}
                      className={controls.item}
                    >
                      <span className={controls.itemIndicator}>
                        <ContextMenu.RadioItemIndicator>
                          <CheckIcon />
                        </ContextMenu.RadioItemIndicator>
                      </span>
                      {classificationLabels[option]}
                    </ContextMenu.RadioItem>
                  ))}
                  <ContextMenu.Separator className={controls.separator} />
                  <ContextMenu.RadioItem
                    value={GUESS}
                    className={controls.item}
                  >
                    <span className={controls.itemIndicator}>
                      <ContextMenu.RadioItemIndicator>
                        <CheckIcon />
                      </ContextMenu.RadioItemIndicator>
                    </span>
                    Use Guess from Font File
                  </ContextMenu.RadioItem>
                </ContextMenu.RadioGroup>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.SubmenuRoot>
      )}
      {!isMissing && (
        <>
          <ContextMenu.Separator className={controls.separator} />
          <ContextMenu.Item
            className={controls.item}
            onClick={() => onUseAs("heading")}
          >
            <span className={controls.itemLabel}>Use as Heading</span>
            <span className={controls.itemHint}>H</span>
          </ContextMenu.Item>
          <ContextMenu.Item
            className={controls.item}
            onClick={() => onUseAs("body")}
          >
            <span className={controls.itemLabel}>Use as Body</span>
            <span className={controls.itemHint}>B</span>
          </ContextMenu.Item>
          <ContextMenu.Separator className={controls.separator} />
          <ContextMenu.Item className={controls.item} onClick={onShowInFolder}>
            <span className={controls.itemLabel}>
              Show in {fileManagerName}
            </span>
          </ContextMenu.Item>
          {installStatus === "not-installed" && (
            <ContextMenu.Item className={controls.item} onClick={onInstall}>
              <span className={controls.itemLabel}>Install</span>
            </ContextMenu.Item>
          )}
          {installStatus === "installed" && (
            <ContextMenu.Item className={controls.item} onClick={onUninstall}>
              <span className={controls.itemLabel}>Uninstall</span>
            </ContextMenu.Item>
          )}
        </>
      )}
    </>
  );
}
