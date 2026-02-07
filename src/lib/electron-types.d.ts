// Type declarations for Electron API exposed via preload

interface ElectronDBAPI {
  query: (sql: string, params?: any[]) => Promise<{ data: any[]; error: string | null }>;
  get: (sql: string, params?: any[]) => Promise<{ data: any; error: string | null }>;
  insert: (table: string, data: Record<string, any>) => Promise<{ data: any; error: string | null }>;
  update: (table: string, data: Record<string, any>, where: Record<string, any>) => Promise<{ data: any; error: string | null }>;
  delete: (table: string, where: Record<string, any>) => Promise<{ data: boolean; error: string | null }>;
}

interface StorageFileResult {
  path: string;
  fullPath: string;
  fileName: string;
}

interface StorageReadResult {
  base64Data: string;
  contentType: string;
  fileName: string;
  size: number;
}

interface StorageUrlResult {
  url: string;
  exists: boolean;
}

interface StorageFileInfo {
  name: string;
  size: number;
  created: Date;
  modified: Date;
}

interface StorageInfoResult {
  basePath: string;
  attachmentsPath: string;
  imagesPath: string;
}

interface ElectronStorageAPI {
  saveFile: (bucket: string, fileName: string, base64Data: string, contentType?: string) => 
    Promise<{ data: StorageFileResult | null; error: string | null }>;
  readFile: (bucket: string, fileName: string) => 
    Promise<{ data: StorageReadResult | null; error: string | null }>;
  getFileUrl: (bucket: string, fileName: string) => 
    Promise<{ data: StorageUrlResult | null; error: string | null }>;
  deleteFile: (bucket: string, fileName: string) => 
    Promise<{ data: boolean; error: string | null }>;
  listFiles: (bucket: string) => 
    Promise<{ data: StorageFileInfo[] | null; error: string | null }>;
  getInfo: () => 
    Promise<{ data: StorageInfoResult; error: string | null }>;
}

interface ElectronAPI {
  isElectron: boolean;
  db: ElectronDBAPI;
  storage: ElectronStorageAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
