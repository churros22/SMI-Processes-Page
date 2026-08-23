import { INITIAL_PROCESSES, GLOBAL_MAP_PROCESS } from '../data/initialProcesses';

const LOCAL_STORAGE_KEY = 'SMI_TOP_GLOVES_CONFIG_V3';
const DB_NAME = 'SMI_TopGloves_Files_DB_V3';
const STORE_NAME = 'process_images';

const DEFAULT_MAP_URL = './processes/cartographie-interactions-smi.png';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileToIndexedDB(key, fileObj) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(fileObj, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB save warning:", err);
    return false;
  }
}

export async function getFileFromIndexedDB(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB read warning:", err);
    return null;
  }
}

export async function loadData() {
  // 1. Priority: Try fetching published data.json from GitHub Pages static folder
  try {
    const res = await fetch('./processes/data.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.processes && data.processes.length > 0) {
        return {
          processes: data.processes,
          globalMapProcess: data.globalMapProcess || GLOBAL_MAP_PROCESS
        };
      }
    }
  } catch (e) {
    // data.json not published yet or error fetching, fallback to LocalStorage
  }

  // 2. Fallback: LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.processes && parsed.processes.length > 0) {
        return {
          processes: parsed.processes,
          globalMapProcess: parsed.globalMapProcess || GLOBAL_MAP_PROCESS
        };
      }
    }
  } catch (e) {
    console.warn("LocalStorage read error:", e);
  }

  // 3. Fallback: Default initial data
  return {
    processes: INITIAL_PROCESSES,
    globalMapProcess: GLOBAL_MAP_PROCESS
  };
}

export async function saveData(processes, globalMapProcess) {
  const data = {
    processes,
    globalMapProcess,
    lastUpdated: new Date().toLocaleDateString('fr-FR')
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("LocalStorage write error:", e);
  }

  return true;
}

export async function uploadImageFile(processId, file) {
  try {
    const buffer = await file.arrayBuffer();
    const fileKey = `img_${processId}_${Date.now()}`;
    const fileData = {
      buffer: buffer,
      name: file.name,
      type: file.type || getMimeType(file.name)
    };

    await saveFileToIndexedDB(fileKey, fileData);

    const blob = new Blob([buffer], { type: fileData.type });
    const blobUrl = URL.createObjectURL(blob);

    return {
      url: blobUrl,
      fileKey: fileKey,
      originalFileName: file.name,
      mimeType: fileData.type
    };
  } catch (err) {
    console.error("Error storing image file:", err);
    throw new Error("Impossible de stocker l'image.");
  }
}

export async function resolveProcessUrl(process) {
  if (!process) return DEFAULT_MAP_URL;

  if (process.fileKey) {
    const fileObj = await getFileFromIndexedDB(process.fileKey);
    if (fileObj && fileObj.buffer) {
      const blob = new Blob([fileObj.buffer], { type: fileObj.type || getMimeType(process.originalFileName || process.url) });
      return URL.createObjectURL(blob);
    }
  }

  if (process.url && process.url.trim().length > 0) {
    return process.url;
  }

  return DEFAULT_MAP_URL;
}

function getMimeType(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}
