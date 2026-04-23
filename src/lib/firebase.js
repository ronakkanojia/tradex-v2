import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAndwaPJKx2tt1ZrX7owS3iaRBx5Bb-320',
  authDomain: 'tradex-59618.firebaseapp.com',
  projectId: 'tradex-59618',
  storageBucket: 'tradex-59618.firebasestorage.app',
  messagingSenderId: '486093074787',
  appId: '1:486093074787:web:313878fcb3d975a7dea356',
  measurementId: 'G-9PG0C9XS90',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export async function initAnalytics() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(app);
}

export default app;
