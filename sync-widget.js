/* ==========================================
   IMPORTS
   ========================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
/* ==========================================
   CONFIG & INIT
   ========================================== */
const firebaseConfig = {
  apiKey: 'AIzaSyBnla41Vp5_MmYNoQyKpzAfN0F5fblwMNA',
  authDomain: 'otwa-prototype.firebaseapp.com',
  projectId: 'otwa-prototype',
  storageBucket: 'otwa-prototype.firebasestorage.app',
  messagingSenderId: '642106168851',
  appId: '1:642106168851:web:7c0c8ba1199c2699a391e6'
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');
googleProvider.setCustomParameters({ prompt: 'consent' });
/* ==========================================
   STATE
   ========================================== */
const DRIVE_FILENAME = 'otwa-app-data.json';
let googleAccessToken = sessionStorage.getItem('fs_gtoken') || null;
let backupIntervalId = null; // <-- NEW
/* ==========================================
   DOM REFS
   ========================================== */
const $ = (id) => document.getElementById(id);

const ui = {
  authBtn: $('fs-auth-btn'),
  userInfo: $('fs-user-info'),
  syncRow: $('fs-sync-row'),
  backup:  $('fs-backup'),
  restore: $('fs-restore'),
  status:  $('fs-status')
};

function setStatus(msg, isError = false) {
  if (!ui.status) return;
  ui.status.textContent = msg;
  ui.status.style.color = isError ? '#c62828' : '#2e7d32';
  if (msg) setTimeout(() => { if (ui.status.textContent === msg) ui.status.textContent = ''; }, 5000);
}
/* ==========================================
   localStorage HELPERS
   ========================================== */
function localStorageToObject() {
  const obj = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    obj[k] = localStorage.getItem(k);
  }
  return obj;
}
function objectToLocalStorage(obj) {
  localStorage.clear();
  for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, v);
}
/* ==========================================
   TOKEN MANAGEMENT
   ========================================== */
async function getValidToken() {
  if (googleAccessToken) return googleAccessToken;
  if (!auth.currentUser) throw new Error('Not signed in');
  const result = await reauthenticateWithPopup(auth.currentUser, googleProvider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  googleAccessToken = cred.accessToken;
  sessionStorage.setItem('fs_gtoken', googleAccessToken);
  return googleAccessToken;
}
/* ==========================================
   DRIVE API HELPERS
   ========================================== */
async function findBackupFile(token) {
  const q = `name='${DRIVE_FILENAME}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=files(id,modifiedTime,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw { status: res.status, message: await res.text() };
  const data = await res.json();
  return data.files?.[0] || null;
}
function multipartBody(meta, payload, boundary) {
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(meta),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(payload),
    `--${boundary}--`
  ].join('\r\n');
}
async function uploadBackup(token, payload, fileId = null) {
  const meta = { name: DRIVE_FILENAME, mimeType: 'application/json' };
  if (!fileId) meta.parents = ['appDataFolder'];
  const boundary = 'bnd_' + Math.random().toString(36).slice(2);
  const body = multipartBody(meta, payload, boundary);
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${await res.text()}`);
  return res.json();
}
async function downloadBackup(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.json();
}
/* ==========================================
   CORE SYNC LOGIC (UI-agnostic)
   ========================================== */
async function performBackup() {
  const token = await getValidToken();
  const payload = {
    exportedAt: new Date().toISOString(),
    origin: location.origin,
    data: localStorageToObject()
  };
  const existing = await findBackupFile(token);
  await uploadBackup(token, payload, existing?.id);
}
async function performRestore() {
  const token = await getValidToken();
  const existing = await findBackupFile(token);
  if (!existing) return false;
  const remote = await downloadBackup(existing.id, token);
  if (remote && remote.data) {
    objectToLocalStorage(remote.data);
    return true;
  }
  return false;
}
/* ==========================================
   AUTO-BACKUP TIMER  <-- NEW SECTION
   ========================================== */
function startAutoBackup() {
  stopAutoBackup();
  backupIntervalId = setInterval(async () => {
    try {
      await performBackup();
      console.log('[AutoBackup] Silent backup complete');
    } catch (err) {
      console.error('[AutoBackup] Silent backup failed:', err);
      if (err.status === 401 || err.message?.includes('401')) {
        googleAccessToken = null;
        sessionStorage.removeItem('fs_gtoken');
      }
    }
  }, 60000); // 60 seconds
}
function stopAutoBackup() {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
  }
}
/* ==========================================
   UI HANDLERS
   ========================================== */
async function handleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    if (!cred?.accessToken) {
      setStatus('Drive permission not granted.', true);
      return;
    }
    googleAccessToken = cred.accessToken;
    sessionStorage.setItem('fs_gtoken', googleAccessToken);
    // <-- NEW: Auto-restore on fresh sign-in, then reload if data changed
    try {
      const didRestore = await performRestore();
      if (didRestore) {
        location.reload(); // refresh app with restored data
      }
    } catch (restoreErr) {
      console.error('Auto-restore failed:', restoreErr);
      // Stay on page; backup interval will start via onAuthStateChanged
    }
  } catch (err) {
    console.error(err);
    setStatus('Sign-in cancelled or failed.', true);
  }
}
async function handleSignOut() {
  stopAutoBackup(); // <-- NEW
  await signOut(auth);
  googleAccessToken = null;
  sessionStorage.removeItem('fs_gtoken');
  setStatus('Signed out.');
}
async function handleBackup() { // Manual button
  try {
    await performBackup();
    setStatus('Backed up to Drive.');
  } catch (err) {
    console.error(err);
    if (err.status === 401 || err.message?.includes('401')) {
      googleAccessToken = null;
      sessionStorage.removeItem('fs_gtoken');
    }
    setStatus('Backup failed.', true);
  }
}
async function handleRestore() { // Manual button
  try {
    const didRestore = await performRestore();
    if (didRestore) setStatus('Restored from Drive.');
    else setStatus('No backup found.', true);
  } catch (err) {
    console.error(err);
    if (err.status === 401 || err.message?.includes('401')) {
      googleAccessToken = null;
      sessionStorage.removeItem('fs_gtoken');
    }
    setStatus('Restore failed.', true);
  }
}
/* ==========================================
   EVENT WIRING
   ========================================== */
// Keep the Drive token warm while the user is actively using the app.
// This prevents the 60-second interval from hitting an expired token.
let isWarmingToken = false;
document.addEventListener('click', async () => {
  if (!auth.currentUser || googleAccessToken || isWarmingToken) return;
  isWarmingToken = true;
  try {
    const result = await reauthenticateWithPopup(auth.currentUser, googleProvider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    googleAccessToken = cred.accessToken;
    sessionStorage.setItem('fs_gtoken', googleAccessToken);
    console.log('[Token] Refreshed silently on user click');
  } catch (e) {
    // Ignore: user might dismiss the popup; interval will try again later
  }
  isWarmingToken = false;
});


if (ui.authBtn) {
  ui.authBtn.addEventListener('click', () => {
    if (auth.currentUser) {
      handleSignOut();
    } else {
      handleSignIn();
    }
  });
}
if (ui.backup)  ui.backup.addEventListener('click', handleBackup);
if (ui.restore) ui.restore.addEventListener('click', handleRestore);

onAuthStateChanged(auth, (user) => {
  if (!ui.authBtn) return;
  if (user) {
    // Signed in state
    ui.authBtn.textContent = 'Sign Out';
    ui.authBtn.classList.add('fs-signed-in'); // hook for your CSS
    if (ui.userInfo) ui.userInfo.textContent = user.email || user.displayName || '';
    if (ui.syncRow)  ui.syncRow.style.display = 'flex';
    googleAccessToken = sessionStorage.getItem('fs_gtoken') || null;
    startAutoBackup(); // resume silent 1-minute sync
  } else {
    // Signed out state
    ui.authBtn.textContent = 'Sync with Google Sign-In';
    ui.authBtn.classList.remove('fs-signed-in');
    if (ui.userInfo) ui.userInfo.textContent = '';
    if (ui.syncRow)  ui.syncRow.style.display = 'none';
    stopAutoBackup(); // stop timer
    googleAccessToken = null;
    sessionStorage.removeItem('fs_gtoken');
  }
});
