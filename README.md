[![Get the add-on](https://img.shields.io/amo/v/aio-playlist-import-export.svg?style=flat-square)](https://addons.mozilla.org/firefox/addon/aio-playlist-import-export/) 
[![Get it on GitHub](https://img.shields.io/badge/Get%20it%20on-GitHub-black?style=for-the-badge&logo=github)](https://github.com/CATEIN/aio-playlist-import-exporter/releases)


# AiO Playlist Import & Exporter

A Chrome web extension for [Adventures in Odyssey](https://app.adventuresinodyssey.com) that allows club members to easily export and import playlists. With this extension, you can export your playlist data in a custom `.aiopl` file format and import it on another account or share it with friends.

## Screenshots

![playlist image](https://github.com/CATEIN/aio-playlist-import-exporter/blob/main/images/playlist.png)

![extension image](https://github.com/CATEIN/aio-playlist-import-exporter/blob/main/images/extension.png)

## Features

- **Import:**  
  Imports playlists by selecting a file (`.aiopl`, `.json`, or `.txt`). The extension will remove any embedded viewer IDs so that the playlist is imported under the current account.

- **Export:**  
  Exports your current playlist data into a `.aiopl` file, containing the following information:
  
  - Playlist name
  - Image for playlist (if given)
  - Episodes in playlist

- **Import List:**  
  Imports given episode links and puts them in a new playlist. You can specify the playlists name and image with `name: "..."` and `imageURL: "..."`

- **Export List:**  
  Generates and copies to the clipboard the episode links from the playlist’s `contentList`, along with the playlists `name` and `imageURL` if the toggle is enabled.

## How it works:

A background script monitors outgoing requests on the main frame (i.e., the full page load) of the Adventures in Odyssey website. It captures the API token and viewer ID from the request headers (specifically the `Authorization`, `x-viewer-id` and `x-pin` headers) and stores them in local storage. *these headers are not shared or sent anywhere other than https://app.adventuresinodyssey.com/ and https://fotf.my.site.com/*

By clicking the Import button, the extension lets you select a file (with a `.aiopl`, `.json`, or `.txt` extension) via a file input.
The selected file is read and parsed as JSON.
Finally, a POST request is made to the API using the current user’s credentials (from the stored token, viewer ID and PIN), and the playlist is imported.

When you click the Export button, the extension checks the active tab’s URL for a playlist identifier (e.g., https://app.adventuresinodyssey.com/playlists/<playlistId>).
The extension uses the stored API token and viewer ID to send a GET request to the API endpoint. Once the full playlist data is received, it “cleans up” the response by:

  - Setting the top-level `metadata` to an empty object.
  - Inserting an empty `errors` array.
  - Including in `contentGroupings` only the keys: `name`, `imageURL` and `contentList`

The cleaned JSON is then converted to a file with the extension .aiopl (named after the playlist) and automatically downloaded.

By clicking the Import List button, the extension first reads the data that has been pasted into the text box. The episode link are then cleaned to have only the `id`
and then parsed as JSON. If the user included `name: "..."` and or `imageURL: "..."` in the list, it sets the playlist name and image with the provided data.

By clicking the Export List button, the extension again fetches the full playlist data. It then extracts each item’s id from the playlist’s contentList, prepends it with
https://app.adventuresinodyssey.com/content/,
and concatenates these URLs (separated by spaces).
The resulting string of links is copied directly to your clipboard, ready to be sent to the bot.



## Setting a custom image on your playlist

  If you want your playlist to have a custom image, the easiest way is include the link in the list before importing.
  But you can also just edit the `.aiopl` file:

  1. Export the playlist you wish to modify
  2. Open the playlist file with a text editor
  3. Locate `"imageURL": "",` and put your image URL here `"imageURL": "https://catein.xyz/images/whit.png",`
     - Note that the image url needs certain headers, so most image urls will not work. Images from the club and https://catein.xyz/images/ have these headers
  4. Save the file and Import it back to the club.
  5. Delete the old playlist

If you did everything correctly, your new playlist should now have a custom image!

## Acknowledgements

  - Special thanks to Adventures in Odyssey for their platform.
  - Inspired by the need for easy playlist management among club members.
