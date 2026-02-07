// Unified storage layer - purely local fs for Electron desktop

// Check if running in Electron
const getIsElectron = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electronAPI?.isElectron;
};

// Storage bucket types
type BucketName = 'lesson-attachments' | 'app-assets' | string;

interface UploadResult {
  path: string;
  url: string;
  fileName: string;
}

interface FileInfo {
  name: string;
  size: number;
  created?: Date;
  modified?: Date;
}

// Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// Parse local-file:// URL
function parseLocalFileUrl(url: string): { bucket: string; fileName: string } | null {
  if (!url.startsWith('local-file://')) return null;
  const parts = url.replace('local-file://', '').split('/');
  return {
    bucket: parts[0],
    fileName: parts.slice(1).join('/')
  };
}

function ensureElectron() {
  if (!getIsElectron()) {
    throw new Error(
      "Storage faqat Electron (desktop) muhitida mavjud. Bu ilova offlayn rejimda ishlaydi."
    );
  }
}

// Unified storage client (pure offline)
export const storage = {
  /**
   * Upload a file to storage
   */
  async upload(bucket: BucketName, file: File, customPath?: string): Promise<{ data: UploadResult | null; error: string | null }> {
    ensureElectron();
    const fileName = customPath || file.name;
    
    try {
      const api = (window as any).electronAPI.storage;
      const base64Data = await fileToBase64(file);
      const result = await api.saveFile(bucket, fileName, base64Data, file.type);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return {
        data: {
          path: result.data.path,
          url: result.data.path, // For Electron, path and URL are the same
          fileName: result.data.fileName
        },
        error: null
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Upload base64 data directly
   */
  async uploadBase64(bucket: BucketName, fileName: string, base64Data: string, contentType: string): Promise<{ data: UploadResult | null; error: string | null }> {
    ensureElectron();
    
    try {
      const api = (window as any).electronAPI.storage;
      const result = await api.saveFile(bucket, fileName, base64Data, contentType);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return {
        data: {
          path: result.data.path,
          url: result.data.path,
          fileName: result.data.fileName
        },
        error: null
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Get public URL for a file
   */
  async getUrl(bucket: BucketName, filePath: string): Promise<{ data: { url: string } | null; error: string | null }> {
    ensureElectron();
    
    // Check if it's already a local-file URL
    const localFile = parseLocalFileUrl(filePath);
    if (localFile) {
      try {
        const api = (window as any).electronAPI.storage;
        const result = await api.getFileUrl(localFile.bucket, localFile.fileName);
        
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        return { data: { url: result.data.url }, error: null };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    }
    
    try {
      const api = (window as any).electronAPI.storage;
      const result = await api.getFileUrl(bucket, filePath);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: { url: result.data.url }, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Read file content as base64
   */
  async read(bucket: BucketName, filePath: string): Promise<{ data: { base64: string; contentType: string } | null; error: string | null }> {
    ensureElectron();
    
    // Check if it's a local-file URL
    const localFile = parseLocalFileUrl(filePath);
    if (localFile) {
      try {
        const api = (window as any).electronAPI.storage;
        const result = await api.readFile(localFile.bucket, localFile.fileName);
        
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        return { 
          data: { 
            base64: result.data.base64Data, 
            contentType: result.data.contentType 
          }, 
          error: null 
        };
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    }
    
    try {
      const api = (window as any).electronAPI.storage;
      const result = await api.readFile(bucket, filePath);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { 
        data: { 
          base64: result.data.base64Data, 
          contentType: result.data.contentType 
        }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Delete a file by URL or bucket+path
   * Can be called as delete(url) or delete(bucket, filePath)
   */
  async delete(bucketOrUrl: BucketName | string, filePath?: string): Promise<{ error: string | null }> {
    ensureElectron();
    
    let bucket: string;
    let path: string;

    // If called with single URL argument
    if (!filePath) {
      const url = bucketOrUrl;
      
      // Check if it's a local-file URL
      const localFile = parseLocalFileUrl(url);
      if (localFile) {
        bucket = localFile.bucket;
        path = localFile.fileName;
      } else {
        return { error: 'Invalid URL format' };
      }
    } else {
      bucket = bucketOrUrl;
      path = filePath;
    }

    try {
      const api = (window as any).electronAPI.storage;
      const result = await api.deleteFile(bucket, path);
      return { error: result.error };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  /**
   * List files in a bucket
   */
  async list(bucket: BucketName): Promise<{ data: FileInfo[] | null; error: string | null }> {
    ensureElectron();
    
    try {
      const api = (window as any).electronAPI.storage;
      const result = await api.listFiles(bucket);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Check if running in offline mode
   */
  get isOffline() { return getIsElectron(); },
  get isOnline() { return false; }, // Always offline

  /**
   * Resolve URL - handles local-file:// URLs
   */
  async resolveUrl(url: string): Promise<string> {
    if (!url) return '';
    
    // Already a valid file:// URL
    if (url.startsWith('file://')) {
      return url;
    }
    
    // Local file URL in Electron
    if (url.startsWith('local-file://') && getIsElectron()) {
      const localFile = parseLocalFileUrl(url);
      if (localFile) {
        const result = await this.getUrl(localFile.bucket as BucketName, localFile.fileName);
        return result.data?.url || url;
      }
    }
    
    return url;
  }
};

// Export helper to check environment
export const isElectronStorage = getIsElectron;
