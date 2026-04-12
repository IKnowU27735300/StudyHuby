'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { syncUser } from '@/app/actions/user';

interface UserProfile {
  college?: string;
  course?: string;
  semester?: number;
  academicYear?: string;
  registrationNo?: string;
  role: 'USER' | 'ADMIN';
  loginStreak: number;
  lastLoginAt: any;
  contributionCount: number;
  followers?: string[];
  following?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isOnboardingComplete: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  isOnboardingComplete: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentProfile = userDoc.data() as UserProfile;
          // Update last login in Firestore
          await setDoc(userDocRef, {
            lastLoginAt: serverTimestamp(),
            // Optionally increment streak here if needed
          }, { merge: true });
          setProfile(currentProfile);
        } else {
          // Initialize fresh profile
          const newProfile: UserProfile = {
            role: 'USER',
            loginStreak: 1,
            lastLoginAt: serverTimestamp(),
            contributionCount: 0,
            followers: [],
            following: [],
          };
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName,
            avatarUrl: user.photoURL,
            ...newProfile,
            createdAt: serverTimestamp(),
          });
          setProfile(newProfile);
        }

        // Sync with MongoDB
        await syncUser({
          firebaseUid: user.uid,
          email: user.email!,
          name: user.displayName,
          avatarUrl: user.photoURL
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isOnboardingComplete = !!(profile?.college && profile?.course && profile?.registrationNo);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, isOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
