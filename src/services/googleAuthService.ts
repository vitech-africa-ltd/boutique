import { db, addAuditLog } from '../lib/db';
import { User } from '../types';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}

// Decode base64url encoded JWT payload safely
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing Google JWT:', e);
    return null;
  }
}

/**
 * Loads the Google Identity Services SDK script
 */
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts) return resolve();

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Processes a verified Google user profile:
 * Finds or creates the user in Dexie DB, assigns role, and returns the User object.
 */
export async function authenticateGoogleUser(profile: GoogleUserProfile, preferredRole: 'admin' | 'manager' | 'cashier' = 'manager'): Promise<User> {
  // Check if a user with this email already exists
  let existingUser = await db.users.where('email').equals(profile.email).first();

  // If not found by email, check by username (name)
  if (!existingUser) {
    existingUser = await db.users.where('username').equals(profile.name).first();
  }

  if (existingUser) {
    // Update profile info
    const updatedUser: User = {
      ...existingUser,
      email: profile.email,
      photoURL: profile.picture || existingUser.photoURL,
      authProvider: 'google'
    };
    await db.users.update(existingUser.id, updatedUser);
    await addAuditLog(
      updatedUser.id,
      updatedUser.username,
      'LOGIN',
      'USER',
      updatedUser.id,
      `Connexion réussie via Google (${profile.email})`
    );
    return updatedUser;
  }

  // New User: Check if database is empty to assign admin automatically
  const totalUsers = await db.users.count();
  const assignedRole: 'admin' | 'manager' | 'cashier' = totalUsers === 0 ? 'admin' : preferredRole;

  const newUser: User = {
    id: `goog-${profile.id.slice(-8) || Math.random().toString(36).substr(2, 9)}`,
    username: profile.name || profile.email.split('@')[0],
    email: profile.email,
    photoURL: profile.picture,
    role: assignedRole,
    authProvider: 'google'
  };

  await db.users.add(newUser);
  await addAuditLog(
    newUser.id,
    newUser.username,
    'CREATE',
    'USER',
    newUser.id,
    `Création automatique de compte via Google (${profile.email}) - Rôle: ${assignedRole}`
  );

  return newUser;
}
