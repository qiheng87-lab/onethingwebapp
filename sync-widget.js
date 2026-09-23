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
const STREAK_FILENAME = 'devotional_streaks.json';
let googleAccessToken = sessionStorage.getItem('fs_gtoken') || null;
let backupIntervalId = null;
/* ==========================================
   DOM REFS
   ========================================== */
const $ = (id) => document.getElementById(id);
const ui = {
  authBtn: $('fs-auth-btn'),
  authStatus: $('fs-auth-status'), 
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
function localStreaksToObject() {
  const obj = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('devotion_')) obj[k] = localStorage.getItem(k);
  }
  return obj;
}
function objectToLocalStreaks(obj) {
  Object.entries(obj).forEach(([k, v]) => {
    if (k.startsWith('devotion_')) localStorage.setItem(k, v);
  });
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
   DRIVE API HELPERS — RESPONSES (existing)
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
   DRIVE API HELPERS — STREAKS (new)
   ========================================== */
async function findStreakFile(token) {
  const q = `name='${STREAK_FILENAME}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=files(id,modifiedTime,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw { status: res.status, message: await res.text() };
  const data = await res.json();
  return data.files?.[0] || null;
}
async function uploadStreakBackup(token, payload, fileId = null) {
  const meta = { name: STREAK_FILENAME, mimeType: 'application/json' };
  if (!fileId) meta.parents = ['appDataFolder'];
  const boundary = 'bnd_' + Math.random().toString(36).slice(2);
  const body = multipartBody(meta, payload, boundary);
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!res.ok) throw new Error(`Streak upload failed: ${await res.text()}`);
  return res.json();
}
async function downloadStreakBackup(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Streak download failed: ${res.status}`);
  return res.json();
}
async function performStreakBackup() {
  const token = await getValidToken();
  const payload = {
    exportedAt: new Date().toISOString(),
    origin: location.origin,
    data: localStreaksToObject()
  };
  const existing = await findStreakFile(token);
  await uploadStreakBackup(token, payload, existing?.id);
}
async function performStreakRestore() {
  const token = await getValidToken();
  const existing = await findStreakFile(token);
  if (!existing) return false;
  const remote = await downloadStreakBackup(existing.id, token);
  if (remote && remote.data) {
    objectToLocalStreaks(remote.data);
    return true;
  }
  return false;
}
/* --- Public API called by app.js --- */
async function pushStreakBackup() {
  try {
    await performStreakBackup();
    console.log('[StreakSync] Push OK');
  } catch (err) {
    console.error('[StreakSync] Push failed:', err);
    if (err.status === 401 || err.message?.includes('401')) {
      googleAccessToken = null;
      sessionStorage.removeItem('fs_gtoken');
    }
  }
}
/* ==========================================
   AUTO-BACKUP TIMER
   ========================================== */
function startAutoBackup() {
  stopAutoBackup();
  backupIntervalId = setInterval(async () => {
    // 1. Responses backup
    try {
      await performBackup();
      console.log('[AutoBackup] Responses backup complete');
    } catch (err) {
      console.error('[AutoBackup] Responses backup failed:', err);
      if (err.status === 401 || err.message?.includes('401')) {
        googleAccessToken = null;
        sessionStorage.removeItem('fs_gtoken');
      }
    }
    // 2. Streak backup (new — piggybacks same timer)
    try {
      await performStreakBackup();
      console.log('[AutoBackup] Streak backup complete');
    } catch (err) {
      console.error('[AutoBackup] Streak backup failed:', err);
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
    /* streak restore first */
    try {
      const didRestoreStreaks = await performStreakRestore();
      if (didRestoreStreaks) {
        window.dispatchEvent(new CustomEvent('streaks-restored'));
      }
    } catch (e) {
      console.error('[StreakSync] Auto-restore failed:', e);
    }
    /* existing response restore */
    try {
      const didRestore = await performRestore();
      if (didRestore) {
        location.reload();
      }
    } catch (restoreErr) {
      console.error('Auto-restore failed:', restoreErr);
    }
  } catch (err) {
    console.error(err);
    setStatus('Sign-in cancelled or failed.', true);
  }
}
async function handleSignOut() {
  stopAutoBackup();
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

onAuthStateChanged(auth, async (user) => {
  if (!ui.authBtn) return;
  
  if (user) {
    ui.authBtn.textContent = 'Sign Out';
    ui.authBtn.classList.add('fs-signed-in');

    // Show "Signed in as ..." beneath the button
    if (ui.authStatus) {
      ui.authStatus.textContent = 'Signed in as ' + (user.email || user.displayName || '');
      ui.authStatus.classList.remove('is-hidden');   // <-- reveal it
    }
    if (ui.syncRow)  ui.syncRow.style.display = 'flex';
    googleAccessToken = sessionStorage.getItem('fs_gtoken') || null;
    
    let didRestoreAnything = false;
    
    if (googleAccessToken) {
      /* 1. Pull responses FIRST — before auto-backup can push empty state */
      try {
        const didRestore = await performRestore();
        if (didRestore) {
          console.log('[Sync] Responses restored from Drive');
          didRestoreAnything = true;
        }
      } catch (err) {
        console.error('[Sync] Response restore failed:', err);
      }
      
      /* 2. Pull streaks */
      try {
        const didRestoreStreaks = await performStreakRestore();
        if (didRestoreStreaks) {
          console.log('[StreakSync] Restored from Drive');
          window.dispatchEvent(new CustomEvent('streaks-restored'));
          didRestoreAnything = true;
        }
      } catch (err) {
        console.error('[StreakSync] Auto-restore failed:', err);
      }
    }
    
    /* 3. If data came down, reload once so app.js renders with fresh localStorage */
    if (didRestoreAnything && !sessionStorage.getItem('fs_did_restore_reload')) {
      sessionStorage.setItem('fs_did_restore_reload', '1');
      location.reload();
      return;
    }
    
    /* 4. Only now start the 60-second push timer */
    startAutoBackup();
    
  } else {
    ui.authBtn.textContent = 'Sync with Google Sign-In';
    ui.authBtn.classList.remove('fs-signed-in');
    if (ui.authStatus) {
      ui.authStatus.textContent = '';
      ui.authStatus.classList.add('is-hidden');      // <-- hide it
    }
    if (ui.syncRow)  ui.syncRow.style.display = 'none';
    stopAutoBackup();
    googleAccessToken = null;
    sessionStorage.removeItem('fs_gtoken');
    sessionStorage.removeItem('fs_did_restore_reload'); // allow reload next sign-in
  }
});

