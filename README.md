# Save LocalStorage

Firefox 附加元件 (Manifest V3)，用來匯出 / 匯入目前網站的 localStorage。

## 開發測試

1. Firefox 開啟 `about:debugging#/runtime/this-firefox`
2. 點「載入暫時性附加元件」，選擇本目錄的 `manifest.json`

或使用 [web-ext](https://github.com/mozilla/web-ext)：

```sh
npx web-ext run    # 啟動測試用 Firefox
npx web-ext lint   # 檢查
npx web-ext build  # 打包成 zip
```

## 匯出檔格式

```json
{
  "format": "save-local-storage",
  "version": 1,
  "origin": "https://example.com",
  "hostname": "example.com",
  "url": "https://example.com/page",
  "exportedAt": "2026-10-20T01:23:45.000Z",
  "count": 2,
  "data": { "key1": "value1", "key2": "value2" }
}
```

匯入時會比對 `origin` (協定 + 網域 + port，與 localStorage 的隔離範圍一致)，
不一致時預設禁止匯入，需要勾選確認才能強制匯入。

## 多語系

字串放在 `_locales/<語系>/messages.json`，目前支援 `en` (預設) 與 `zh_TW`。

- HTML：在元素加上 `data-i18n="鍵名"`，載入時由 `localizePage()` 填入文字
- JS：使用 `t("鍵名", 參數)` (即 `browser.i18n.getMessage`)
- manifest：使用 `__MSG_鍵名__`

新增字串時兩個語系檔都要加上同樣的鍵。
