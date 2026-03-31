import { storage } from '../firebase';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';

export class StorageService {
  /**
   * Uploads a base64 string to Firebase Storage and returns the download URL.
   */
  static async uploadBase64(base64: string, path: string, retries = 2): Promise<string> {
    if (!base64 || !base64.startsWith('data:')) {
      const errorMsg = `Invalid base64 data for path: ${path}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        console.log(`Starting upload to ${path} (Attempt ${attempt + 1})...`);
        const storageRef = ref(storage, path);
        
        // Convert base64 to Blob for uploadBytes as requested
        const blob = await this.dataUrlToBlob(base64);
        
        const uploadPromise = uploadBytes(storageRef, blob);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Upload timeout for ${path}`)), 120000)
        );

        const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
        console.log(`Upload successful for ${path}: ${result.metadata.fullPath}`);
        
        const url = await getDownloadURL(storageRef);
        console.log(`Download URL generated for ${path}: ${url}`);
        return url;
      } catch (error: any) {
        attempt++;
        const errorCode = error?.code || 'unknown-code';
        const errorMessage = error?.message || String(error);
        
        console.error(`Storage upload error for ${path} (Attempt ${attempt}):`, {
          code: errorCode,
          message: errorMessage,
          fullError: error
        });

        // Prevent infinite retries if upload fails due to permission errors
        if (errorCode === 'storage/unauthorized' || errorCode === 'storage/forbidden') {
          console.error(`Permission denied for ${path}. Stopping retries.`);
          throw new Error(`Permission denied: ${errorMessage} (Code: ${errorCode})`);
        }

        if (attempt > retries) {
          throw new Error(`Failed to upload to ${path} after ${retries + 1} attempts. Last error: ${errorMessage} (Code: ${errorCode})`);
        }

        console.log(`Retrying upload to ${path} in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error(`Failed to upload to ${path} after ${retries + 1} attempts`);
  }

  /**
   * Uploads a Blob to Firebase Storage and returns the download URL.
   */
  static async uploadBlob(blob: Blob, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }

  /**
   * Converts a data URL to a Blob.
   */
  static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }
}
