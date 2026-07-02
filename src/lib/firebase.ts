import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClinicalNote } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const loginAnonymously = async (name: string, email: string) => {
  try {
    localStorage.setItem('recapmind_demo_name', name);
    localStorage.setItem('recapmind_demo_email', email);
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Anonymous login failed", error);
    throw error;
  }
};

export const logout = () => auth.signOut();

export const getTrainingData = async (): Promise<any[]> => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'training_data'),
      where('author_id', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return list;
  } catch (error) {
    console.error("Error fetching training data:", error);
    return [];
  }
};

export const saveTrainingData = async (
  transcript: string, 
  finalNote: ClinicalNote, 
  modelUsed: string,
  patientId: string,
  sessionNo: string
) => {
  if (!auth.currentUser) {
    throw new Error("User must be signed in to contribute training data.");
  }

  try {
    const docRef = await addDoc(collection(db, 'training_data'), {
      transcript,
      final_note: finalNote,
      model_used: modelUsed,
      patient_id: patientId,
      session_no: sessionNo,
      created_at: serverTimestamp(),
      author_id: auth.currentUser.uid
    });
    console.log("Training data saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving training data: ", error);
    // Standardized error per instructions
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: 'create',
      path: 'training_data',
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified
      }
    };
    throw new Error(JSON.stringify(errInfo));
  }
};
