import { ipcMain } from "electron";
import type { z } from "zod";
import { storageChannels } from "../../shared/contracts/channels";
import {
  classificationsFileSchema,
  collectionsFileSchema,
  prefsFileSchema,
  type SaveResult,
  type StoredData,
} from "../../shared/contracts/storage";
import type { JsonFile } from "../storage/json-file";
import type { Stores } from "../storage/stores";

export function registerStorageHandlers(stores: Stores): void {
  ipcMain.handle(
    storageChannels.loadAll,
    async (): Promise<StoredData> => ({
      collections: await stores.collections.load(),
      classifications: await stores.classifications.load(),
      prefs: await stores.prefs.load(),
    }),
  );

  handleSave(
    storageChannels.saveCollections,
    collectionsFileSchema,
    stores.collections,
  );
  handleSave(
    storageChannels.saveClassifications,
    classificationsFileSchema,
    stores.classifications,
  );
  handleSave(storageChannels.savePrefs, prefsFileSchema, stores.prefs);
}

function handleSave<T>(
  channel: string,
  schema: z.ZodType<T>,
  file: JsonFile<T>,
): void {
  ipcMain.handle(
    channel,
    async (_event, input: unknown): Promise<SaveResult> => {
      const data = schema.parse(input);
      try {
        await file.save(data);
        return { status: "saved" };
      } catch (error) {
        console.error(`Couldn't save to ${channel}`, error);
        return { status: "failed" };
      }
    },
  );
}
