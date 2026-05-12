// Browser API client for the local Flask editor backend.
// Each function wraps one HTTP endpoint and returns normalized JSON or an error.

// Small wrapper functions around the local Flask editor API.
//
// Keeping fetch calls in one file keeps the editor UI code focused on state and
// rendering instead of repeated HTTP boilerplate.

export async function loadDataApi() {
  const response = await fetch('/api/data');

  if (!response.ok) {
    throw new Error('Could not load data.');
  }

  return response.json();
}

export async function saveDataApi(payload) {
  const response = await fetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save data.');
  }

  return response.json();
}

export async function saveGalleryCurationApi(galleryCuration) {
  const response = await fetch('/api/gallery-curation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ galleryCuration })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save gallery curation.');
  }

  return response.json();
}


export async function saveGalleryCurationWallApi(wall) {
  const response = await fetch('/api/gallery-curation/wall', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ wall })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save gallery wall curation.');
  }

  return response.json();
}

export async function saveImageUpdatesApi(imageId, updates) {
  const response = await fetch('/api/image-updates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageId, updates })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save image updates.');
  }

  return response.json();
}


export async function renameImageIdApi(currentImageId, newImageId) {
  const response = await fetch('/api/rename-image-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentImageId, newImageId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not rename image ID.');
  }

  return response.json();
}

export async function importReviewedImagesApi(formData) {
  const response = await fetch('/api/import-reviewed', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not import images.');
  }

  return response.json();
}

export async function listBackupsApi() {
  const response = await fetch('/api/backups');

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not load backups.');
  }

  return response.json();
}

export async function restoreBackupApi(backupFolder) {
  const response = await fetch('/api/backups/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ backupFolder })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not restore backup.');
  }

  return response.json();
}
