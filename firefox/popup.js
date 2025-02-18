document.addEventListener('DOMContentLoaded', () => {
  // Set the checkbox state from storage
  chrome.storage.local.get(['includeDetailsToggle'], (result) => {
    if (result.includeDetailsToggle !== undefined) {
      document.getElementById('includeDetailsToggle').checked = result.includeDetailsToggle;
    }
  });
  // Save the checkbox state when changed
  document.getElementById('includeDetailsToggle').addEventListener('change', function() {
    chrome.storage.local.set({ includeDetailsToggle: this.checked });
  });

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
    chrome.runtime.openOptionsPage(); // Opens options.html where the file input lives
  });
  // When a file is selected, read it and import.
  document.getElementById('importFile').addEventListener('change', function(e) {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) {
      showToast("No file selected.");
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
      chrome.storage.local.get(['apiToken', 'viewerId', 'xPin'], (result) => {
        const token = result.apiToken;
        const viewerId = result.viewerId;
        // Convert xPin to string if defined; if not, use an empty string.
        const xPin = (result.xPin !== undefined && result.xPin !== null) ? String(result.xPin) : "";
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
            'x-pin': xPin,
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
  // IMPORT LIST FUNCTIONALITY
  // This handles importing a playlist from a list of episode URLs/IDs.
  // The user can specify a playlist name and an image URL.
  // -------------------------------


  document.getElementById('importListBtn').addEventListener('click', () => {

    const inputField = document.getElementById('importListInput');
    let line = inputField.value.trim();
    if (!line) {
      showToast("Please enter list data to import.");
      return;
    }
    // Default values
    let playlistName = "Imported Playlist";
    let imageURL = "";
    // Regex to find name:"..." or imageURL:"..." (case-insensitive)
    const nameRegex = /name:\s*"([^"]*)"/i;
    const imageRegex = /imageURL:\s*"([^"]*)"/i;
    // 1. Capture name
    const nameMatch = line.match(nameRegex);
    if (nameMatch) {
      playlistName = nameMatch[1];
      // Remove the matched segment from the input
      line = line.replace(nameMatch[0], "");
    }
    // 2. Capture imageURL
    const imageMatch = line.match(imageRegex);
    if (imageMatch) {
      imageURL = imageMatch[1];
      // Remove the matched segment from the input
      line = line.replace(imageMatch[0], "");
    }

    // Now remove commas, then split the remainder by whitespace.
    line = line.replace(/,/g, " ");
    const tokens = line.split(/\s+/).filter(Boolean);
    const prefix = "https://app.adventuresinodyssey.com/content/";
    const episodeIDs = [];

    // For each leftover token, if it starts with the prefix, strip it.
    tokens.forEach(token => {
      if (token.toLowerCase().startsWith("name:") || token.toLowerCase().startsWith("imageurl:")) {
        // If the user typed name: or imageURL: without quotes, we ignore it here
        // because we specifically require quotes for multi-word or spaced values.
        return;
      }
      if (token.startsWith(prefix)) {
        episodeIDs.push(token.slice(prefix.length));
      } else {
        episodeIDs.push(token);
      }
    });
    const payload = {
      metadata: {},
      errors: [],
      contentGroupings: [
        {
          name: playlistName,
          imageURL: imageURL,
          contentList: episodeIDs.map(id => ({ id }))
        }
      ]
    };

    chrome.storage.local.get(['apiToken', 'viewerId', 'xPin'], (result) => {
      const token = result.apiToken;
      const viewerId = result.viewerId;
      const xPin = (result.xPin !== undefined && result.xPin !== null) ? String(result.xPin) : "";
      if (!token) {
        showToast("No API token available.");
        return;
      }
      if (!viewerId) {
        showToast("No viewer ID available.");
        return;
      }
      const apiUrl = "https://fotf.my.site.com/aio/services/apexrest/v1/contentgrouping";
      console.log("Importing list with payload:", payload);
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-viewer-id': viewerId,
          'x-pin': xPin,
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
          console.log("Import list response:", data);
          showToast("List imported successfully!");
        })
        .catch(error => {
          console.error("Error importing list:", error);
          showToast("Error importing list: " + error.message, 4000);
        });
    });
  });
  // -------------------------------
  // EXPORT FUNCTIONALITY
  // When the "Export" button is clicked, determine the current playlist ID from the active tab’s URL,
  // fetch the full playlist data, "clean it up" (set metadata to {} and errors to [],
  // and in contentGroupings only include name and imageURL. In contentList, only episode IDs),
  // then trigger a file download with the filename "<playlist name>.aiopl".
  // -------------------------------
  document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get(['apiToken', 'viewerId', 'xPin'], (result) => {
      const token = result.apiToken;
      const viewerId = result.viewerId;
      const xPin = (result.xPin !== undefined && result.xPin !== null) ? String(result.xPin) : "";
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
          showToast("Not on a playlist page.");
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
            'x-pin': xPin,
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
                  contentList: (playlistData.contentList || []).map(item => ({ id: item.id }))
                }
              ]
            };
            const cleanedJSON = JSON.stringify(cleanedData, null, 2);
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
// EXPORT LIST FUNCTIONALITY (Renamed from Export KYDS Radio)
// When the "Export List" button is clicked, fetch the current playlist,
// extract the "id" from each item in the contentList, prefix it with
// "https://app.adventuresinodyssey.com/content/", and copy the resulting text
// to the clipboard. If the toggle is checked, also prepend the name and imageURL.
// -------------------------------
document.getElementById('exportKYDSBtn').addEventListener('click', () => {
  chrome.storage.local.get(['apiToken', 'viewerId', 'xPin'], (result) => {
    const token = result.apiToken;
    const viewerId = result.viewerId;
    const xPin = (result.xPin !== undefined && result.xPin !== null) ? String(result.xPin) : "";
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
        showToast("Not on a playlist page.");
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
          'x-pin': xPin,
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
          // Build the string of episode links.
          let links = "";
          if (playlistData.contentList && playlistData.contentList.length > 0) {
            links = playlistData.contentList.map(content => {
              return "https://app.adventuresinodyssey.com/content/" + content.id;
            }).join(" ");
          }
          // Check if the toggle is enabled to include name and imageURL.
          const includeDetails = document.getElementById('includeDetailsToggle').checked;
          if (includeDetails) {
            let details = "";
            if (playlistData.name) {
              details += "name: \"" + playlistData.name + "\"\n";
            }
            if (playlistData.imageURL) {
              details += "imageURL: \"" + playlistData.imageURL + "\"\n";
            }
            links = details + links;
          }
          navigator.clipboard.writeText(links)
            .then(() => {
              showToast("Content list copied to clipboard.");
            })
            .catch(err => {
              console.error("Failed to copy content list:", err);
              showToast("Failed to copy content list.", 4000);
            });
        })
        .catch(error => {
          console.error("Error fetching playlist info:", error);
          showToast("Error fetching playlist info.", 4000);
        });
    });
  });
});
});
