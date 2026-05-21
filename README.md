# IncredibleSmartDisplay

リビング据え置き用スマートディスプレイの自分用運用メモ。

## ブランチ運用

基本方針:

- `main`: 実機運用・GitHub Pages 公開用。常に公開してよい状態にする
- `develop`: 次の公開候補。通常の作業結果を集約して検証する
- `feature/*`: 個別作業用。README、UI、CI、依存更新など目的ごとに分ける

反映順:

```text
feature/* -> develop -> main -> GitHub Pages
```

運用ルール:

- `main` へ入ると GitHub Pages deploy が走る
- `develop` と `feature/*` では CI のみ走らせ、deploy しない
- `main` へ入れる前に `build` / `test:run` / `lint` を通す
- UI変更、CI変更、依存更新、リファクタは別コミットにする
- `develop` と `main` の差分を大きくしすぎない

現状メモ:

- 旧作業ブランチ名は `development`
- 今後は `develop` に寄せる
- `development` に残っている変更は `develop` へ引き継いだ後、リモート整理を検討する

ローカル移行コマンド例:

```powershell
git fetch origin
git switch development
git switch -c develop
```

リモートへ反映する場合:

```powershell
git push -u origin develop
```

`main` は公開用なので、`develop` で検証した後に merge する。

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

## Fully Kiosk Browser 推奨設定

未確定のため、まずは以下を推奨値として扱う。

- 横向き固定
- 全画面表示
- 画面スリープ抑止
- ピンチズーム抑止
- スクロールバー非表示
- 起動URLは GitHub Pages の公開URL
- 定期リロードは dashboard config の autoReload と重複しないようにする

実機で文字切れ、カードのはみ出し、タップしづらさがあれば、まず `documents/*layout-preview.html` で比較してから app 側へ反映する。
