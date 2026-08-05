# 我的知識圖譜

用互動式網絡圖持續記錄學到的知識,存放在 GitHub 上長期累積。

## 線上瀏覽

啟用 GitHub Pages 後,可以透過網址直接看圖(不需要下載任何東西)。

## 本機預覽

直接用瀏覽器打開 `index.html` 即可(不需要架伺服器,也不需要安裝任何套件)。

## 專案結構

```
.
├── index.html          網頁主體
├── css/style.css        樣式(深色發光風格)
├── js/graph.js          用 D3.js 畫力導向網絡圖的邏輯
└── data/knowledge.json  知識內容(節點與關聯),之後新增知識只需要編輯這個檔案
```

## 如何新增一個新知識點

打開 `data/knowledge.json`,在 `nodes` 陣列裡新增一個節點,例如:

```json
{
  "id": "python-decorator",
  "label": "Python 裝飾器",
  "category": "程式",
  "notes": "用來在不改動原函式的情況下,對函式包一層額外行為。@ 語法糖背後就是 func = decorator(func)。",
  "date": "2026-08-10"
}
```

欄位說明:

| 欄位 | 說明 |
|---|---|
| `id` | 唯一識別碼,英文/數字,節點之間用它來連接,不會顯示在畫面上 |
| `label` | 畫面上顯示的節點名稱 |
| `category` | 分類,會決定節點顏色,同分類會自動同色 |
| `notes` | 點擊節點後,右側面板顯示的筆記內容 |
| `date` | 記錄日期,方便之後回顧學習軌跡(可省略) |

接著在 `links` 陣列裡,把新節點連到相關的既有節點:

```json
{ "source": "python-decorator", "target": "mindmap-system" }
```

`source`/`target` 填的是節點的 `id`。一個節點可以連到多個節點,不限於樹狀結構。

## 更新後如何存回 GitHub

在專案資料夾內執行:

```bash
git add -A
git commit -m "新增知識點:Python 裝飾器"
git push
```

## 操作提示

- 拖曳節點可以手動調整位置
- 滾輪可以縮放,拖曳空白處可以平移畫面
- 點擊節點會在右側顯示筆記,並淡化不相關的節點
- 上方搜尋框可以依名稱快速找到節點

## 之後的使用方式

之後只要跟 Claude Code 說「我今天學了 XX,幫我加進心智圖」,就可以請它直接編輯 `data/knowledge.json` 並幫你 commit / push,不需要自己手動改 JSON。
