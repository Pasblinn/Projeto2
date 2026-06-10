const { contextBridge } = require('electron')

// Minimal bridge: the app is fully client-side (localStorage database),
// so only harmless metadata is exposed to the renderer.
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
})
