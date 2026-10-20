// popup 與 import 頁面共用的工具函式

const EXPORT_FORMAT = "save-local-storage";
const EXPORT_VERSION = 1;

const t = (key, substitutions) => browser.i18n.getMessage(key, substitutions);

// 將頁面中帶有 data-i18n 屬性的元素替換成對應語系的文字
function localizePage() {
  document.documentElement.lang = browser.i18n.getUILanguage();
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
}

// 以下函式會透過 scripting.executeScript 注入到目標網頁中執行,
// 因此不能引用外部變數, 必須是自給自足的函式。

function pageGetInfo() {
  let count = 0;
  try {
    count = localStorage.length;
  } catch (e) {
    return { origin: location.origin, error: String(e) };
  }
  return { origin: location.origin, hostname: location.hostname, url: location.href, count };
}

function pageReadLocalStorage() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }
  return { origin: location.origin, hostname: location.hostname, url: location.href, data };
}

function pageWriteLocalStorage(data, clearFirst, expectedOrigin) {
  // 在頁面內再確認一次 origin, 避免分頁在這段期間已經跳到別的網站
  // (注入的程式碼無法使用 browser.i18n, 所以回傳錯誤代碼由呼叫端翻譯)
  if (location.origin !== expectedOrigin) {
    return { ok: false, code: "originChanged", actual: location.origin };
  }
  try {
    if (clearFirst) localStorage.clear();
    let written = 0;
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
      written++;
    }
    return { ok: true, written };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function runInTab(tabId, func, args = []) {
  const [result] = await browser.scripting.executeScript({
    target: { tabId },
    func,
    args,
  });
  if (result.error) throw new Error(String(result.error));
  return result.result;
}
