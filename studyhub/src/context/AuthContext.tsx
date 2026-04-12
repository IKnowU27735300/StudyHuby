'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  totalDownloads: number;
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
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot for real-time profile updates
        unsubscribeProfile = onSnapshot(userDocRef, async (userDoc: any) => {
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            const lastLogin = profileData.lastLoginAt?.toDate() || new Date();
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let newStreak = profileData.loginStreak || 1;

            const isSameDay = (d1: Date, d2: Date) => 
              d1.getFullYear() === d2.getFullYear() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getDate() === d2.getDate();

            // We only want to update the streak if it's a new day
            // and we don't want to trigger an infinite loop of updates
            if (!isSameDay(lastLogin, today)) {
              let updatedStreak = 1;
              if (isSameDay(lastLogin, yesterday)) {
                updatedStreak = newStreak + 1;
              }

              await setDoc(userDocRef, {
                lastLoginAt: serverTimestamp(),
                loginStreak: updatedStreak,
              }, { merge: true });
            }

            setProfile(profileData as UserProfile);
          } else {
            // Initialize fresh profile if doesn't exist
            const newProfile: UserProfile = {
              role: 'USER',
              loginStreak: 1,
              lastLoginAt: serverTimestamp(),
              contributionCount: 0,
              totalDownloads: 0,
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
        });

        // Sync with MongoDB (one-time)
        await syncUser({
          firebaseUid: user.uid,
          email: user.email!,
          name: user.displayName,
          avatarUrl: user.photoURL
        });
      } else {
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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

  // Heartbeat to mark user as active
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          lastSeen: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 2 * 60 * 1000); // Every 2 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  const isOnboardingComplete = !!(profile?.college && profile?.course && profile?.registrationNo);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, isOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
