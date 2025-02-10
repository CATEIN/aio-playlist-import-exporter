# AiO Playlist Import & Exporter

![Extension logo](https://github.com/CATEIN/aio-playlist-import-exporter/blob/main/AiO%20Playlist%20Export%20%26%20Inport/icons/icon128.png)


A Chrome web extension for [Adventures in Odyssey](https://app.adventuresinodyssey.com) that allows club members to easily export and import playlists. With this extension, you can export your playlist data in a custom `.aiopl` file format and import it on another account or share it with friends.

## Features

- **Export:**  
  Exports your current playlist data into a `.aiopl` file, containing the following information:
  
  - Playlist name
  - Episodes in playlist
  - Image for playlist (if given)

- **Export KYDS Radio:**  
  Generates and copies to the clipboard the episode links from the playlist’s `contentList`, formatted for my KYDS Radio discord bot.

- **Import:**  
Imports playlists by selecting a file (`.aiopl`, `.json`, or `.txt`). The extension will remove any embedded viewer IDs so that the playlist is imported under the current account.

## How it works:

A background script monitors outgoing requests on the main frame (i.e., the full page load) of the Adventures in Odyssey website. It captures the API token and viewer ID from the request headers (specifically the `Authorization` and `x-viewer-id` headers) and stores them in local storage. *The token and viewer-id are not shared or sent anywhere other than https://app.adventuresinodyssey.com/ and https://fotf.my.site.com/*

When you click the Export button, the extension checks the active tab’s URL for a playlist identifier (e.g., https://app.adventuresinodyssey.com/playlists/<playlistId>).
The extension uses the stored API token and viewer ID to send a GET request to the API endpoint. Once the full playlist data is received, it “cleans up” the response by:

  - Setting the top-level `metadata` to an empty object.
  - Inserting an empty `errors` array.
  - Including in `contentGroupings` only the keys: `name`, `imageURL` and `contentList`

The cleaned JSON is then converted to a file with the extension .aiopl (named after the playlist) and automatically downloaded.

By clicking the Export KYDS Radio button, the extension again fetches the full playlist data. It then extracts each item’s id from the playlist’s contentList, prepends it with
https://app.adventuresinodyssey.com/content/,
and concatenates these URLs (separated by spaces).
The resulting string of links is copied directly to your clipboard, ready to be sent to the bot.

By clicking the Import button, the extension lets you select a file (with a .aiopl, .json, or .txt extension) via a file input.
The selected file is read and parsed as JSON.
Finally, a POST request is made to the API using the current user’s credentials (from the stored token and viewer ID), and the playlist is imported.
