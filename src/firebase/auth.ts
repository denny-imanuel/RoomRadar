import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect,
  signOut 
} from "firebase/auth";
import { auth } from './config';
import { db } from './config';
import { doc, getDoc, setDoc } from "firebase/firestore";

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const userRef = doc(db, "users", user.uid);
    const userInDb = await getDoc(userRef);

    if (!userInDb.exists()) {
      const newUser = {
        id: user.uid,
        email: user.email,
        name: user.email, // Default name to email
        role: 'tenant', // Default role
        createdAt: new Date(),
      };
      await setDoc(userRef, newUser);
    }
    return result;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};
