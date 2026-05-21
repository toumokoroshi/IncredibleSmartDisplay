# IncredibleSmartDisplay

リビング据え置き用スマートディスプレイの自分用運用メモ。

## ブランチ運用

基本方針:

- `main`: 実機運用・GitHub Pages 公開用。常に公開してよい状態にする
- `develop`: 次の公開候補。通常の作業結果を集約して検証する
- `feature/*`: 個別作業用。README、UI、CI、依存更新など目的ごとに分ける

反映順。PRは使わず、ローカルで検証してから fast-forward merge する。

```text
feature/* -> develop -> main -> GitHub Pages
```

運用ルール:

- `main` へ入ると GitHub Pages deploy が走る
- `develop` と `feature/*` を push すると CI のみ走り、deploy はしない
- `main` へ入れる前に `build` / `test:run` / `lint` を通す
- `main` への反映は `git merge --ff-only develop` を基本にする
- `main` では直接作業しない。修正が必要なら `develop` に戻って直す
- UI変更、CI変更、依存更新、リファクタは別コミットにする
- `develop` と `main` の差分を大きくしすぎない

普段の作業開始:

```powershell
git switch develop
```

作業後に `develop` へ保存:

```powershell
git status
npm.cmd run build
npm.cmd run test:run
npm.cmd run lint
git add <changed-files>
git commit -m "<purpose>"
git push origin develop
```

公開する時:

```powershell
git switch develop
git status
npm.cmd run build
npm.cmd run test:run
npm.cmd run lint

git switch main
git pull --ff-only origin main
git merge --ff-only develop
git push origin main
git switch develop
```

`git merge --ff-only develop` が失敗した場合は、`main` と `develop` が分岐している。無理に merge commit を作らず、先に状況を確認する。

旧 `development` branch は使わない。`develop` 運用が安定した後で、必要なら GitHub 上とローカルから削除する。

## ユーザーがやる操作

`develop` に push した後:

1. GitHub の Actions タブを開く
2. `CI` workflow の結果を見る
3. `develop` の CI が成功していれば、次に公開してよい候補として扱う

公開したい時:

```powershell
git switch develop
git status
npm.cmd run build
npm.cmd run test:run
npm.cmd run lint

git switch main
git pull --ff-only origin main
git merge --ff-only develop
git push origin main
git switch develop
```

`git push origin main` 後:

1. GitHub の Actions タブを開く
2. `Deploy Pages` workflow が成功することを確認する
3. GitHub Pages の公開URLを開いて表示を確認する
4. タブレット / Fully Kiosk Browser で実機表示を確認する

失敗時:

- `CI` が失敗したら `develop` のまま修正する
- `Deploy Pages` が失敗したら `main` に追加修正を重ねず、まず `develop` で原因を直す
- `git merge --ff-only develop` が失敗したら、`main` と `develop` が分岐しているので、無理に merge commit を作らず状況を確認する
- 公開後に表示が崩れたら、`develop` で修正して検証し、再度 `main` へ反映する

## 検証コマンド

Windows PowerShell では `npm.ps1` が実行ポリシーで止まることがあるため、`npm.cmd` を使う。

```powershell
npm.cmd run build
npm.cmd run test:run
npm.cmd run lint
```

coverage 確認:

```powershell
npm.cmd run test:coverage
```

## GitHub Pages

正式 deploy は `main` branch への push で行う。

Workflow:

- `.github/workflows/deploy-pages.yml`
- `npm ci`
- `npm run test:run`
- `npm run build`
- GitHub Pages deploy

GitHub repository settings では Pages source を GitHub Actions にする。

## ローカル起動

```powershell
npm.cmd ci
npm.cmd run dev
```

Vite が表示する URL をブラウザで開く。

## ペット写真の更新

元写真は `private-pet-photos/` に置く。このディレクトリは公開用ではない。

公開用写真と manifest を作り直す:

```powershell
npm.cmd run prepare-pet-photos
```

出力先:

- `public/pets/*.jpg`
- `public/pets/manifest.json`

写真を追加・削除したら、manifest を作り直してから `build` / `test:run` / `lint` を確認する。

## 交通情報 JSON の手動運用

Traffic は `staticJson` provider で `public/data/traffic.json` を読む。初期運用では外部APIから自動取得せず、この JSON を手動更新する。

更新手順:

1. 公式サイトやアプリで対象路線の運行情報を確認する
2. `public/data/traffic.json` を編集する
3. `updatedAt` と対象 `lines[].updatedAt` を ISO 8601 文字列で更新する
4. `npm.cmd run build`
5. `npm.cmd run test:run`
6. `npm.cmd run lint`
7. commit して `develop` に push する
8. 公開する場合は `develop` を `main` に fast-forward merge する

JSON 契約:

```json
{
  "updatedAt": "2026-05-22T07:30:00+09:00",
  "lines": [
    {
      "id": "jr-chuo-rapid",
      "name": "中央線快速",
      "operator": "JR東日本",
      "status": "normal",
      "updatedAt": "2026-05-22T07:30:00+09:00"
    }
  ]
}
```

必須項目:

- `updatedAt`: JSON全体の更新時刻
- `lines[].id`: `dashboard.config.ts` の `lines[].id` と一致させる
- `lines[].name`: 表示名
- `lines[].status`: `"normal" | "delayed" | "partiallyDelayed" | "suspended" | "unknown"`
- `lines[].updatedAt`: 路線ごとの確認時刻

任意項目:

- `lines[].operator`
- `lines[].delayMinutes`
- `lines[].statusText`
- `lines[].detail`
- `lines[].reason`
- `lines[].recoveryEstimate`
- `lines[].alternateTransport`

手動更新時は、対象8路線を原則すべて残す。未確認の路線は削除せず `status: "unknown"` にする。自動取得へ移行する場合も、この JSON 契約を維持する。

## Fully Kiosk Browser 推奨設定

初期運用は常時表示モードにする。画面焼け、発熱、電池劣化が気になったら motion / screen off 運用へ切り替える。

- Start URL: `https://toumokoroshi.github.io/IncredibleSmartDisplay/`
- Fullscreen Mode: ON
- Kiosk Mode: ON
- Screen Orientation: Landscape
- Keep Screen On: ON
- Autostart on Boot: ON
- JavaScript: ON
- Text Zoom / Page Zoom: 100%
- Pull to Refresh: OFF
- Pinch to Zoom: OFF
- Auto Reload on Internet Reconnect: ON
- Auto Reload on Screen On: OFFから開始
- Periodic / Idle Auto Reload: OFF
- Remote Admin: OFFから開始。必要になったら強いパスワードを設定して有効化する
- Motion Detection: OFFから開始

リロード方針:

- app側: `dashboard.config.ts` の `autoReload` を使う
- Fully Kiosk側: network reconnect の再読み込みだけ使う
- Periodic reload は app側と重複するため使わない

実機確認:

- GitHub Pages URL: `https://toumokoroshi.github.io/IncredibleSmartDisplay/`
- 確認日: 2026-05-21
- 確認端末: Xiaomi 12.4インチタブレット / 横置き
- 確認結果: GitHub Actions 正常、GitHub Pages 表示正常、タブレット横置きレイアウト正常

## YouTube を見る時

Dashboard 常設表示を基本にしつつ、必要な時だけ YouTube を見る運用にする。

推奨:

- 通常時は Fully Kiosk Browser で Dashboard を表示する
- YouTube 視聴時は Kiosk Mode を一時解除して YouTube app を使う
- 視聴後は Fully Kiosk Browser に戻し、Start URL を再表示する

避けること:

- Dashboard の Start URL を YouTube に変えない
- Fully Kiosk の許可URLに YouTube を広く混ぜない
- Dashboard と YouTube を同じ kiosk session 内で頻繁に行き来する前提にしない

理由:

- YouTube はログイン、動画再生、画面回転、音量操作、広告、バックグラウンド復帰など、Dashboard 固定表示とは要求が違う
- Dashboard 用の Kiosk 設定を強くしすぎると YouTube が使いにくくなる
- YouTube に寄せると Dashboard の常時表示安定性が落ちる

必要なら後で Fully Kiosk の App Launcher か Android ホーム画面に YouTube を置く。ただし初期運用では、手動で Kiosk Mode を抜けて YouTube app を開く方式にする。

実機で文字切れ、カードのはみ出し、タップしづらさがあれば、まず `documents/*layout-preview.html` で比較してから app 側へ反映する。
