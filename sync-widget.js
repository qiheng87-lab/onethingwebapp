/* ==========================================
   CONFIG
   ========================================== */
const firebaseConfig = {
  apiKey: 'AIzaSyBnla41Vp5_MmYNoQyKpzAfN0F5fblwMNA',
  authDomain: 'otwa-prototype.firebaseapp.com',
  projectId: 'otwa-prototype',
  storageBucket: 'otwa-prototype.firebasestorage.app',
  messagingSenderId: '642106168851',
  appId: '1:642106168851:web:7c0c8ba1199c2699a391e6'
};
const DRIVE_FILENAME = 'otwa-app-data.json';   // hidden in Drive appDataFolder
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
   INIT FIREBASE
   ========================================== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.appdata');
/* ==========================================
   STATE
   ========================================== */
let googleAccessToken = sessionStorage.getItem('fs_gtoken') || null;
/* ==========================================
   DOM REFS
   ========================================== */
const $ = (id) => document.getElementById(id);
const ui = {
  signin:  $('fs-signin'),
  signout: $('fs-signout'),
  user:    $('fs-user'),
  syncRow: $('fs-sync-row'),
  backup:  $('fs-backup'),
  restore: $('fs-restore'),
  status:  $('fs-status')
};
/* ==========================================
   HELPERS
   ========================================== */
function setStatus(msg, isError = false) {
  ui.status.textContent = msg;
  ui.status.style.color = isError ? '#c62828' : '#2e7d32';
  if (msg) setTimeout(() => { if (ui.status.textContent === msg) ui.status.textContent = ''; }, 5000);
}
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
  for (const [k, v] of Object.entries(obj)) {
    localStorage.setItem(k, v);
  }
}
/* ==========================================
   TOKEN MANAGEMENT
   ========================================== */
async function getValidToken() {
  if (googleAccessToken) return googleAccessToken;
  if (!auth.currentUser) throw new Error('Not signed in');
  setStatus('Refreshing sign-in…');
  const result = await reauthenticateWithPopup(auth.currentUser, provider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  googleAccessToken = cred.accessToken;
  sessionStorage.setItem('fs_gtoken', googleAccessToken);
  return googleAccessToken;
}
/* ==========================================
   DRIVE API
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
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.json();
}
/* ==========================================
   ACTIONS
   ========================================== */
async function handleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    googleAccessToken = cred.accessToken;
    sessionStorage.setItem('fs_gtoken', googleAccessToken);
    setStatus('Signed in.');
  } catch (err) {
    console.error(err);
    setStatus('Sign-in cancelled or failed.', true);
  }
}
async function handleSignOut() {
  await signOut(auth);
  googleAccessToken = null;
  sessionStorage.removeItem('fs_gtoken');
  setStatus('Signed out.');
}
async function handleBackup() {
  try {
    const token = await getValidToken();
    const payload = {
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      data: localStorageToObject()
    };
    const existing = await findBackupFile(token);
    await uploadBackup(token, payload, existing?.id);
    setStatus(`Backed up ${Object.keys(payload.data).length} keys to Drive.`);
  } catch (err) {
    console.error(err);
    if (err.status === 401 || err.message?.includes('401')) {
      googleAccessToken = null;
      sessionStorage.removeItem('fs_gtoken');
    }
    setStatus('Backup failed. Sign in again if your session expired.', true);
  }
}
async function handleRestore() {
  try {
    const token = await getValidToken();
    const existing = await findBackupFile(token);
    if (!existing) {
      setStatus('No backup found in Drive app folder.', true);
      return;
    }
    const remote = await downloadBackup(existing.id, token);
    if (remote && remote.data) {
      objectToLocalStorage(remote.data);
      setStatus(`Restored from backup (${remote.exportedAt || 'unknown date'}). Reload if your UI needs to reflect changes.`);
    } else {
      setStatus('Backup file was empty or unreadable.', true);
    }
  } catch (err) {
    console.error(err);
    if (err.status === 401 || err.message?.includes('401')) {
      googleAccessToken = null;
      sessionStorage.removeItem('fs_gtoken');
    }
    setStatus('Restore failed. Sign in again if your session expired.', true);
  }
}
/* ==========================================
   UI WIRING
   ========================================== */
ui.signin.addEventListener('click', handleSignIn);
ui.signout.addEventListener('click', handleSignOut);
ui.backup.addEventListener('click', handleBackup);
ui.restore.addEventListener('click', handleRestore);
onAuthStateChanged(auth, (user) => {
  if (user) {
    ui.signin.style.display = 'none';
    ui.signout.style.display = '';
    ui.syncRow.style.display = 'flex';
    ui.user.textContent = user.email || user.displayName || 'Signed in';
  } else {
    ui.signin.style.display = '';
    ui.signout.style.display = 'none';
    ui.syncRow.style.display = 'none';
    ui.user.textContent = '';
  }
});
