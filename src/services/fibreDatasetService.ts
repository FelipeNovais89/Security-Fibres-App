import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { FibreAnalysis, FibreObject, DatasetSample, Calibration } from '../types/fibre';
import { StorageService } from './storageService';

export class FibreDatasetService {
  static async saveAnalysis(analysis: FibreAnalysis, objects: FibreObject[]) {
    try {
      // 1. Upload images to Storage if they are base64
      let originalImageUrl = analysis.originalImage;
      if (originalImageUrl.startsWith('data:')) {
        originalImageUrl = await StorageService.uploadBase64(originalImageUrl, `analyses/${analysis.id}/original.jpg`);
      }

      let annotatedImageUrl = analysis.annotatedImage;
      if (annotatedImageUrl && annotatedImageUrl.startsWith('data:')) {
        annotatedImageUrl = await StorageService.uploadBase64(annotatedImageUrl, `analyses/${analysis.id}/annotated.jpg`);
      }

      // 2. Save metadata to Firestore
      const { 
        originalImage: _oldOriginal, 
        annotatedImage: _oldAnnotated, 
        ...analysisMetadata 
      } = analysis;

      const analysisRef = await addDoc(collection(db, 'fibre_analyses'), {
        ...analysisMetadata,
        originalImage: originalImageUrl,
        annotatedImage: annotatedImageUrl,
        timestamp: serverTimestamp(),
      });

      // Save objects in a subcollection or separate collection
      const batchPromises = objects.map(obj => 
        addDoc(collection(db, 'fibre_objects'), {
          ...obj,
          analysisId: analysisRef.id,
          timestamp: serverTimestamp(),
        })
      );

      await Promise.all(batchPromises);
      return analysisRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fibre_analyses');
      throw error;
    }
  }

  static async saveToDataset(sample: DatasetSample) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Dataset saving timed out (180s)')), 180000)
    );

    try {
      const saveOperation = (async () => {
        console.log('--- Starting Dataset Save Operation ---', { 
          id: sample.id,
          label: sample.label,
          hasOriginal: !!sample.originalImageUrl,
          hasMask: !!sample.maskImageUrl,
          hasPreview: !!sample.annotatedPreviewUrl
        });
        
        try {
          // 1. Upload images to Storage in parallel
          console.log(`Uploading images for sample ${sample.id}...`);
          const uploadPromises: Promise<string>[] = [
            StorageService.uploadBase64(sample.originalImageUrl, `dataset/${sample.id}/original.jpg`),
            StorageService.uploadBase64(sample.maskImageUrl, `dataset/${sample.id}/mask.png`)
          ];

          const hasPreview = sample.annotatedPreviewUrl && sample.annotatedPreviewUrl.startsWith('data:');
          if (hasPreview) {
            uploadPromises.push(StorageService.uploadBase64(sample.annotatedPreviewUrl!, `dataset/${sample.id}/preview.jpg`));
          }

          console.log(`Waiting for ${uploadPromises.length} uploads to complete...`);
          const results = await Promise.all(uploadPromises);
          
          const originalImageUrl = results[0];
          const maskImageUrl = results[1];
          const annotatedPreviewUrl = hasPreview ? results[2] : sample.annotatedPreviewUrl;
          
          console.log('All images uploaded successfully');

          // 2. Save metadata to Firestore
          console.log('Saving metadata to Firestore...');
          
          // Remove base64 strings from the object to avoid Firestore 1MB limit
          const { 
            originalImageUrl: _oldOriginal, 
            maskImageUrl: _oldMask, 
            annotatedPreviewUrl: _oldPreview, 
            ...metadata 
          } = sample;

          const docData = {
            ...metadata,
            originalImageUrl,
            maskImageUrl,
            annotatedPreviewUrl,
            timestamp: serverTimestamp(),
          };

          console.log('Firestore document data prepared (base64 removed)');
          
          const docRef = await addDoc(collection(db, 'fibre_training_dataset'), docData);
          console.log('Save successful! Document ID:', docRef.id);
        } catch (innerError) {
          console.error('Inner save error details:', innerError);
          throw innerError;
        }
      })();

      await Promise.race([saveOperation, timeoutPromise]);
    } catch (error) {
      console.error('Final error in saveToDataset:', error);
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn('The operation timed out, but it might still complete in the background.');
      }
      handleFirestoreError(error, OperationType.WRITE, 'fibre_training_dataset');
      throw error;
    }
  }

  static async saveCalibration(calibration: Calibration) {
    try {
      await setDoc(doc(db, 'fibre_calibrations', calibration.id), {
        ...calibration,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fibre_calibrations');
      throw error;
    }
  }

  static async getCalibrations(cameraId: string): Promise<Calibration[]> {
    try {
      const q = query(collection(db, 'fibre_calibrations'), where('cameraId', '==', cameraId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Calibration));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'fibre_calibrations');
      return [];
    }
  }
}
