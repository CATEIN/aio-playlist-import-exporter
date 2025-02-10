chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const updates = {};
    // Capture the Authorization header (the token)
    const authHeader = details.requestHeaders.find(header =>
      header.name.toLowerCase() === "authorization"
    );
    if (authHeader) {
      updates.apiToken = authHeader.value;
    }
    // Capture the x-viewer-id header
    const viewerHeader = details.requestHeaders.find(header =>
      header.name.toLowerCase() === "x-viewer-id"
    );
    if (viewerHeader) {
      updates.viewerId = viewerHeader.value;
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  },
  { urls: ["https://app.adventuresinodyssey.com/*", "https://fotf.my.site.com/*"] },
  ["requestHeaders"]
);
