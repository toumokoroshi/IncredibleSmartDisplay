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
