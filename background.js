// 由背景頁負責下載檔案:
// popup 在跳出「另存新檔」對話框時會被關閉, 若在 popup 內建立 blob URL 會跟著失效。

const pendingBlobUrls = new Map(); // downloadId -> blob URL

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== "download-json") return;

  const blob = new Blob([message.content], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  return browser.downloads
    .download({ url, filename: message.filename })
    .then((downloadId) => {
      pendingBlobUrls.set(downloadId, url);
      return { ok: true };
    })
    .catch((e) => {
      URL.revokeObjectURL(url);
      return { ok: false, error: String(e) };
    });
});

browser.downloads.onChanged.addListener((delta) => {
  const state = delta.state?.current;
  if (state !== "complete" && state !== "interrupted") return;
  const url = pendingBlobUrls.get(delta.id);
  if (url) {
    URL.revokeObjectURL(url);
    pendingBlobUrls.delete(delta.id);
  }
});
