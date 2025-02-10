document.addEventListener('DOMContentLoaded', () => {

  // Utility: showToast displays a transient message (e.g. for errors or confirmations)
  function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }

  // -------------------------------
  // IMPORT FUNCTIONALITY:
  // When the "Import" button is clicked, read the file selected by the user,
  // parse it as JSON, and POST it (raw) as the payload.
  // -------------------------------
  document.getElementById('importBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files || fileInput.files.length === 0) {
      showToast("Please select a file to import.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileContent = e.target.result;
      let payload;
      try {
        payload = JSON.parse(fileContent);
      } catch (error) {
        showToast("Invalid JSON in file: " + error.message, 4000);
        return;
      }
      chrome.storage.local.get(['apiToken', 'viewerId'], (result) => {
        const token = result.apiToken;
        const viewerId = result.viewerId;
        if (!token) {
          showToast("No API token available.");
          return;
        }
        if (!viewerId) {
          showToast("No viewer ID available.");
          return;
        }
        const apiUrl = "https://fotf.my.site.com/aio/services/apexrest/v1/contentgrouping";
        console.log("Importing playlist with payload:", payload);
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-viewer-id': viewerId,
            'x-experience-name': "Adventures In Odyssey"
          },
          body: JSON.stringify(payload)
        })
          .then(response => {
            if (!response.ok) {
              return response.json().then(errData => {
                throw new Error(JSON.stringify(errData));
              });
            }
            return response.json();
          })
          .then(data => {
            console.log("Import response:", data);
            showToast("Import successful!");
          })
          .catch(error => {
            console.error("Error importing playlist:", error);
            showToast("Error importing playlist: " + error.message, 4000);
          });
      });
    };
    reader.onerror = function(e) {
      showToast("Error reading file: " + e.target.error, 3000);
    };
    reader.readAsText(file);
  });

  // -------------------------------
  // EXPORT FUNCTIONALITY (File Download):
  // When the "Export" button is clicked, determine the current playlist ID from the active tab’s URL,
  // fetch the full playlist data, "clean it up" (set metadata to {} and errors to [],
  // and in contentGroupings only include name, imageURL, contentList, content_for_parents),
  // then trigger a file download with the filename "<playlist name>.aiopl".
  // -------------------------------
  document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get(['apiToken', 'viewerId'], (result) => {
      const token = result.apiToken;
      const viewerId = result.viewerId;
      if (!token) {
        showToast("No API token available.");
        return;
      }
      if (!viewerId) {
        showToast("No viewer ID available.");
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs.length) {
          showToast("No active tab found.");
          return;
        }
        const currentTab = tabs[0];
        const url = currentTab.url;
        const match = url.match(/\/playlists\/([^\/\?]+)/);
        if (!match) {
          document.getElementById('playlistContainer').innerHTML = "Not on a playlist page.";
          return;
        }
        const playlistId = match[1];
        const apiUrl = `https://fotf.my.site.com/aio/services/apexrest/v1/contentgrouping/${playlistId}`;
        console.log("Fetching full playlist info from:", apiUrl);
        const playlistContainer = document.getElementById('playlistContainer');
        playlistContainer.innerHTML = "Loading playlist info...";
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'x-viewer-id': viewerId,
            'x-experience-name': "Adventures In Odyssey"
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.json();
          })
          .then(data => {
            let playlistData;
            if (data.contentGroupings && data.contentGroupings.length > 0) {
              playlistData = data.contentGroupings.find(pg => pg.id === playlistId) || data.contentGroupings[0];
            } else {
              playlistData = data;
            }
            playlistContainer.innerHTML = "";
            const item = document.createElement('div');
            item.className = "playlistItem";
            item.textContent = playlistData.name || "Unnamed Playlist";
            // Build the cleaned-up export object.
            const cleanedData = {
              metadata: {},
              errors: [],
              contentGroupings: [
                {
                  name: playlistData.name || "",
                  imageURL: playlistData.imageURL || "",
                  contentList: playlistData.contentList || [],
                  content_for_parents: playlistData.content_for_parents || []
                }
              ]
            };
            const cleanedJSON = JSON.stringify(cleanedData, null, 2);
            // Create a Blob from the JSON.
            const blob = new Blob([cleanedJSON], { type: "application/json" });
            const urlObject = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const filename = (playlistData.name ? playlistData.name : "playlist") + ".aiopl";
            a.href = urlObject;
            a.download = filename;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(urlObject);
            showToast("Playlist exported as " + filename);
          })
          .catch(error => {
            console.error("Error fetching playlist info:", error);
            playlistContainer.innerHTML = "Error fetching playlist info.";
          });
      });
    });
  });

  // -------------------------------
  // EXPORT KYDS RADIO FUNCTIONALITY:
  // When the "Export KYDS Radio" button is clicked, fetch the current playlist,
  // extract the "id" from each item in the contentList, prefix it with
  // "https://app.adventuresinodyssey.com/content/", join the links with a space,
  // and copy the resulting text to the clipboard.
  // -------------------------------
  document.getElementById('exportKYDSBtn').addEventListener('click', () => {
    chrome.storage.local.get(['apiToken', 'viewerId'], (result) => {
      const token = result.apiToken;
      const viewerId = result.viewerId;
      if (!token) {
        showToast("No API token available.");
        return;
      }
      if (!viewerId) {
        showToast("No viewer ID available.");
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs.length) {
          showToast("No active tab found.");
          return;
        }
        const currentTab = tabs[0];
        const url = currentTab.url;
        const match = url.match(/\/playlists\/([^\/\?]+)/);
        if (!match) {
          document.getElementById('playlistContainer').innerHTML = "Not on a playlist page.";
          return;
        }
        const playlistId = match[1];
        const apiUrl = `https://fotf.my.site.com/aio/services/apexrest/v1/contentgrouping/${playlistId}`;
        console.log("Fetching full playlist info from:", apiUrl);
        fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'x-viewer-id': viewerId,
            'x-experience-name': "Adventures In Odyssey"
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.json();
          })
          .then(data => {
            let playlistData;
            if (data.contentGroupings && data.contentGroupings.length > 0) {
              playlistData = data.contentGroupings.find(pg => pg.id === playlistId) || data.contentGroupings[0];
            } else {
              playlistData = data;
            }
            // Build the string of links.
            let links = "";
            if (playlistData.contentList && playlistData.contentList.length > 0) {
              links = playlistData.contentList.map(content => {
                return "https://app.adventuresinodyssey.com/content/" + content.id;
              }).join(" ");
            }
            navigator.clipboard.writeText(links)
              .then(() => {
                showToast("KYDS Radio links copied to clipboard.");
              })
              .catch(err => {
                console.error("Failed to copy KYDS Radio links:", err);
                showToast("Failed to copy KYDS Radio links.");
              });
          })
          .catch(error => {
            console.error("Error fetching playlist info:", error);
            showToast("Error fetching playlist info.");
          });
      });
    });
  });
});
