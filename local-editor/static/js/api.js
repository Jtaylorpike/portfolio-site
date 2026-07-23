// Browser API client for the local Flask editor backend.
// Each function wraps one HTTP endpoint and returns normalized JSON or an error.

// Small wrapper functions around the local Flask editor API.
//
// Keeping fetch calls in one file keeps the editor UI code focused on state and
// rendering instead of repeated HTTP boilerplate.

export async function loadDataApi() {
  const cacheBust = encodeURIComponent(String(Date.now()));
  const response = await fetch(`/api/data?cacheBust=${cacheBust}`, { cache: 'no-store' });

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

export async function saveGalleryRoomApi(galleryRoom) {
  const response = await fetch('/api/gallery-room', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ galleryRoom })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save gallery room layout.');
  }

  return response.json();
}

export async function saveSiteSeoApi(siteSeo) {
  const response = await fetch('/api/site-seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteSeo })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save site settings.');
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


export async function renameImageIdApi(currentImageId, newImageId, imageUpdates = {}) {
  const response = await fetch('/api/rename-image-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentImageId, newImageId, imageUpdates })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not rename image ID.');
  }

  return response.json();
}

export async function importReviewedImagesApi(formData, options = {}) {
  const { onUploadProgress } = options;

  // XMLHttpRequest gives the editor real upload progress events. Fetch is still
  // cleaner for most API calls, but it cannot report multipart upload progress
  // in the browsers this local editor targets.
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('POST', '/api/import-reviewed');

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || typeof onUploadProgress !== 'function') {
        return;
      }

      onUploadProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100)
      });
    });

    request.addEventListener('load', () => {
      let payload = null;

      try {
        payload = request.responseText ? JSON.parse(request.responseText) : null;
      } catch (error) {
        reject(new Error('Import response was not valid JSON.'));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        const details = Array.isArray(payload?.errors) && payload.errors.length
          ? ` ${payload.errors.join(' ')}`
          : '';
        reject(new Error(`${payload?.error ?? 'Could not import images.'}${details}`));
        return;
      }

      resolve(payload);
    });

    request.addEventListener('error', () => {
      reject(new Error('Could not import images. Check that the local editor server is still running.'));
    });

    request.addEventListener('abort', () => {
      reject(new Error('Image import was canceled.'));
    });

    request.send(formData);
  });
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


export async function importReviewedAboutPhotosApi(formData, options = {}) {
  const { onUploadProgress } = options;

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/about-photos/import');

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && typeof onUploadProgress === 'function') {
        onUploadProgress({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
      }
    });

    request.addEventListener('load', () => {
      const payload = JSON.parse(request.responseText || '{}');

      if (request.status < 200 || request.status >= 300) {
        const details = Array.isArray(payload.errors) ? ` ${payload.errors.join(' ')}` : '';
        reject(new Error(`${payload.error ?? 'Could not import About photos.'}${details}`));
        return;
      }

      resolve(payload);
    });

    request.addEventListener('error', () => {
      reject(new Error('Could not import About photos.'));
    });

    request.send(formData);
  });
}

