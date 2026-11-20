# TODO: 設定匯入合併模式 (Config Import Merge Mode)

本文件規劃未來在「匯入設定」中支援**增量合併 (Merge & Append)** 模式時的架構設計、邊界情況與衝突處理策略。

---

## 1. 背景與需求動機

目前匯入功能採用「完全覆蓋 (Full Overwrite)」策略：以匯入的檔案完全替換現有設定，並於匯入前提示警告。
未來規劃提供「合併模式 (Merge)」，讓使用者能從社群、同事或官方下載特定的「手勢包 (Gesture Pack)」，並將其融合至自己現有的設定中，而不破壞原有自訂的手勢。

---

## 2. 合併的核心挑戰與衝突情境 (Conflict Scenarios)

### 情況一：完全一致的手勢與動作 (Exact Match)
- **現象**：匯入的手勢軌跡（如 `R + [D, R]`）與對應動作（如 `^w` 關閉分頁）與現有設定完全相同。
- **處理策略**：自動跳過（Skip / No-op），不重複新增。

### 情況二：手勢相同，但動作不同 (Gesture Collision with Different Action)
- **現象**：
  - 現有設定：`R + [D, R]` -> `^w` (關閉分頁)
  - 匯入檔案：`R + [D, R]` -> `#m` (最小化所有視窗)
- **核心困難**：滑鼠觸發時同一目標下同一手勢只能觸發一個動作，系統無法自動判定哪一個是使用者真正想要的。
- **解決方案評估**：
  1. **覆蓋模式 (Incoming Wins)**：以匯入檔案的動作取代目前動作。適合使用者明確想套用新手勢包的場景。
  2. **保留現有模式 (Existing Wins / Skip Conflicts)**：保留目前手勢，僅匯入目前未定義的新手勢。適合保守擴充。
  3. **互動式差異裁決器 (Interactive Conflict Resolver / Diff Modal)**：
     - 彈出對話框，列出所有衝突清單。
     - 每一列提供 Radio / Checkbox 讓使用者逐項勾選使用「目前版本」或「匯入版本」。
     - 顯示雙方的動作名稱、類型與數值對比。

### 情況三：目標群組 (Target Groups) 的合併
- **現象**：匯入檔中包含同名的應用群組（如 `Group 01` 或 `Chrome`）。
- **處理策略**：
  - **執行檔清單 (Executables)**：取聯集 (Union & Deduplicate)。
  - **按鍵綁定 (Bindings)**：依據情況二的衝突規則進行手勢比對。

### 情況四：範本庫 (Templates) 的 ID 碰撞
- **現象**：`gestureTemplates` 或 `actionTemplates` 的 `id` 相同，但內容不同。
- **處理策略**：
  - 為匯入的項目重新產生 UUID 或加上字尾（如 `act-close-tab_imported`），避免關聯參照錯亂。

---

## 3. 建議實作階段 (Phased Implementation)

- **Phase 1 (當前版本)**：完整實作「完全覆蓋模式」，具備警示確認視窗與 Schema 格式校驗。
- **Phase 2**：加入全域合併策略切換開關（「覆蓋衝突」 vs 「略過衝突」）。
- **Phase 3**：實作可視化衝突解決視窗 (Visual Diff & Conflict Resolver UI)。
