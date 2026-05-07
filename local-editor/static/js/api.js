export async function loadDataApi() {
  const response = await fetch("/api/data");

  if (!response.ok) {
    throw new Error("Could not load data.");
  }

  return response.json();
}

export async function saveDataApi(payload) {
  const response = await fetch("/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Could not save data.");
  }

  return response.json();
}

export async function importReviewedImagesApi(formData) {
  const response = await fetch("/api/import-reviewed", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Could not import images.");
  }

  return response.json();
}
export async function saveImageUpdatesApi(imageId, updates) {
  const response = await fetch('/api/image-updates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageId,
      updates
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Could not save image updates.');
  }

  return response.json();
}
