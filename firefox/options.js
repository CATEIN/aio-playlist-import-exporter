// Utility: showToast displays a transient message.
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }
  
  // When a file is selected, read it and send the payload.
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
      // Retrieve credentials from storage.
      chrome.storage.local.get(['apiToken', 'viewerId', 'xPin'], function(result) {
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
        console.log("Sending payload:", payload);
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
            return response.json().then(errData => { throw new Error(JSON.stringify(errData)); });
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
  