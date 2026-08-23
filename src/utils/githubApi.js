const GITHUB_CONFIG_KEY = 'SMI_GITHUB_CONFIG_V1';

export function getGitHubConfig() {
  try {
    const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Error reading GitHub config:", e);
  }
  return {
    owner: 'churros22',
    repo: 'SMI-Processes-Page',
    branch: 'main',
    token: ''
  };
}

export function saveGitHubConfig(config) {
  try {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Error saving GitHub config:", e);
    return false;
  }
}

export async function testGitHubConnection(config) {
  const { owner, repo, token } = config;
  if (!owner || !repo || !token) {
    throw new Error("Veuillez remplir l'utilisateur, le nom du dépôt et le jeton d'accès (Token).");
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Jeton d'accès GitHub invalide ou expiré.");
    if (res.status === 404) throw new Error(`Dépôt "${owner}/${repo}" introuvable ou vous n'avez pas la permission.`);
    throw new Error(`Erreur API GitHub (${res.status})`);
  }

  const data = await res.json();
  return {
    success: true,
    fullName: data.full_name,
    defaultBranch: data.default_branch
  };
}

// Convert ArrayBuffer or Blob to Base64 String
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert UTF-8 String to Base64 (supporting accents)
export function utf8ToBase64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

export async function commitFileToGitHub({ path, contentBase64, commitMessage, config = null, maxRetries = 3 }) {
  const cfg = config || getGitHubConfig();
  const { owner, repo, branch = 'main', token } = cfg;

  if (!owner || !repo || !token) {
    throw new Error("Configuration API GitHub incomplète. Veuillez configurer le jeton dans le panneau Admin.");
  }

  const cleanPath = path.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;

    // 1. GET fresh SHA from GitHub (using _t parameter for cache buster, NO custom CORS headers)
    let sha = null;
    try {
      const getRes = await fetch(`${url}?ref=${branch}&_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const getJson = await getRes.json();
        sha = getJson.sha || null;
      } else if (getRes.status === 401 || getRes.status === 403) {
        const errData = await getRes.json().catch(() => ({}));
        throw new Error(errData.message || "Erreur d'authentification GitHub (401/403). Vérifiez votre Token.");
      }
    } catch (e) {
      if (e.message && e.message.includes("GitHub")) throw e;
      console.log("File does not exist yet on GitHub, creating new file.");
    }

    // 2. PUT commit
    const body = {
      message: commitMessage || `[Admin Update] Update ${cleanPath}`,
      content: contentBase64,
      branch: branch
    };
    if (sha) {
      body.sha = sha;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (putRes.ok) {
      const resJson = await putRes.json();
      return {
        success: true,
        commitSha: resJson.commit?.sha,
        downloadUrl: resJson.content?.download_url,
        path: cleanPath
      };
    }

    const errorJson = await putRes.json().catch(() => ({}));

    // If 409 Conflict or 422 SHA mismatch, wait 800ms and retry with fresh SHA
    if ((putRes.status === 409 || putRes.status === 422) && attempt < maxRetries) {
      console.warn(`GitHub API 409/422 Conflict on ${cleanPath}, retrying attempt ${attempt}...`);
      await new Promise(r => setTimeout(r, 800));
      continue;
    }

    throw new Error(errorJson.message || `Erreur commit GitHub (${putRes.status})`);
  }
}

export async function commitProcessDataToGitHub(processes, globalMapProcess, commitMessage = null) {
  const data = {
    processes,
    globalMapProcess,
    lastUpdated: new Date().toLocaleDateString('fr-FR')
  };

  const jsonString = JSON.stringify(data, null, 2);
  const base64Content = utf8ToBase64(jsonString);

  return await commitFileToGitHub({
    path: 'public/processes/data.json',
    contentBase64: base64Content,
    commitMessage: commitMessage || `[Admin Update] Métadonnées des processus mises à jour`
  });
}

export async function uploadImageToGitHub(file, targetFileName, commitMessage = null) {
  const buffer = await file.arrayBuffer();
  const base64Content = arrayBufferToBase64(buffer);
  const path = `public/processes/${targetFileName}`;

  return await commitFileToGitHub({
    path,
    contentBase64: base64Content,
    commitMessage: commitMessage || `[Admin Upload] Nouveau fichier PNG : ${targetFileName}`
  });
}
