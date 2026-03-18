import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { FibreAnalysis, FibreObject, DatasetSample, Calibration } from '../types/fibre';

export class FibreDatasetService {
  static async saveAnalysis(analysis: FibreAnalysis, objects: FibreObject[]) {
    try {
      const analysisRef = await addDoc(collection(db, 'fibre_analyses'), {
        ...analysis,
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
    try {
      await addDoc(collection(db, 'fibre_training_dataset'), {
        ...sample,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
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
