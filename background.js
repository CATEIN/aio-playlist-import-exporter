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

    // Capture the x-pin header; if not found, set it to an empty string.
    const viewerPin = details.requestHeaders.find(header =>
      header.name.toLowerCase() === "x-pin"
    );
    if (viewerPin) {
      updates.xPin = viewerPin.value;
    } else {
      updates.xPin = "";
    }

    if (Object.keys(updates).length > 0) {
      console.log("Updating stored credentials:", updates);
      chrome.storage.local.set(updates);
    }
  },
  { urls: ["https://app.adventuresinodyssey.com/*", "https://fotf.my.site.com/*"] },
  ["requestHeaders"]
);

