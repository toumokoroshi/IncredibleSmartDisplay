# リファクタリング計画: 重複排除・責務整理・テスト補強(挙動不変)

作成日: 2026-07-05 / 対象ブランチ(予定): `feature/refactor-dedupe`(main から新規作成)
ステータス: 計画のみ。実装未着手。

## Context

スマートディスプレイ用ダッシュボード(React 19 + TS + Vite + TanStack Query、GitHub Pages 運用 → 将来ローカルサーバー移行)のリファクタリング。調査の結果、サービス層/WidgetDefinition/レジストリのアーキテクチャは AGENTS.md・ProjectCodingRules.md に沿って健全で、テストも28ファイルと厚い。一方で以下の問題がある:

1. **重複**: 全6ウィジェットで Card ヘッダー+Loading/Error/Empty/Stale の枠組みコードがコピーされている。サービス層4箇所に同一のバリデーションヘルパー、2箇所に `isWidgetErrorCode`、複数箇所に同等の時刻フォーマッタ。
2. **責務混在**: TrafficWidget(386行)・WeatherWidget(490行)・CalendarWidget(416行)がプレゼンテーションと純ロジック(状態集計・ノート生成・イベント選択)を1ファイルに抱えており、ロジックがテスト不能。
3. **特異な設計**: レンダー毎の `validateDashboardConfig()` 再実行と localStorage 同期読取、`useQuery<any>`、トートロジーな `getHighlightedType`、デッドコード、`src/App.tsx` 再エクスポートシム。
4. **テスト欠落**: TrafficWidget のみコンポーネントテストもロジックテストも皆無。Weather/Calendar のコンポーネント内ロジックも未テスト。

**決定事項**: 今回は挙動不変の純粋リファクタのみ。挙動が変わる修正(meteocons CDN 自己ホスト化、カレンダー now 更新、index.html 整理)は実施せず提案として記録する。

## ブランチ

現在の `feature/refactor-cleanup` は main にマージ済み(main..HEAD 空)。main から新規ブランチを作成:

```
git switch -c feature/refactor-dedupe main
```

(CI は `feature/**` push で走るため命名は `feature/` プレフィックス必須)

## 実装ステップ(AGENTS.md に従い1コミット1目的)

### Step 1: TrafficWidget の回帰テストを先に追加(characterization)
- 新規 `src/widgets/traffic/TrafficWidget.test.tsx` — 既存の `NewsWidget.test.tsx` / `CalendarWidget.test.tsx` のスタイルに合わせる。QuickLook(通常/遅延/見合わせ混在)と Detail(isHighlighted)を `mockTrafficLines`(`src/services/traffic/mockData.ts`)相当のフィクスチャで描画し、サマリラベル(「通常 n/m」「見合わせ n/m」等)・ヘッドライン・行表示を検証。
- 以降の抽出リファクタの安全網。**コミット1**

### Step 2: サービス層バリデーションヘルパーの共通化
- 新規 `src/services/validationGuards.ts`: `optionalString` / `optionalIsoDateTimeString` / `isIsoDateTimeString`。
- 参照元を置換: `trafficService.ts:78-88`, `newsService.ts:33-39`, `stockService.ts:8`, `calendarService.ts:8`。既存サービステストがそのまま回帰網になる。**コミット2**

### Step 3: WidgetError 正規化の一元化
- 新規 `src/utils/widgetError.ts`: `isWidgetErrorCode`(`jsonProvider.ts:31` と `useWidgetData.ts:18` の重複を統合)と `useWidgetData.ts` の `normalizeError` を移設。`isRetryableErrorCode` も jsonProvider から寄せる。
- 小さなユニットテスト `widgetError.test.ts` を追加。**コミット3**

### Step 4: 日付フォーマッタの統合
- `src/utils/date.ts` に追加: `formatHourMinuteLabel`(ja-JP, hour/minute 2-digit, hour12:false)。`TrafficWidget.tsx:10-16` と `NewsWidget.tsx:40-46` の同一 `formatTime` を置換。
- CalendarWidget ローカルの汎用日付関数 `startOfDay` / `addDays` / `isSameDay` / `getDaysInMonth` / `formatMonthTitle` を `utils/date.ts` へ移設し、`date.test.ts` を新規追加(現状 utils/date.ts はテストなし)。**コミット4**

### Step 5: TrafficWidget ロジック抽出
- 新規 `src/widgets/traffic/trafficStatusDisplay.ts`(weather の `weatherConditionDisplay.ts` と同じパターン): `getCounts` / `getSummary` / `getTrafficSeverity` / `getDetailHeadline` / `getActionSummary` / `getStatusLabel` / `getDetailStatusLabel` / `getStatusClass` / `getSeverityClasses` / `getLineTextClass` を TrafficWidget.tsx:18-196 から verbatim 移動。
- 新規 `trafficStatusDisplay.test.ts`: 重要分岐(suspended 優先 / unknown を通常扱いしない / delayed 件数表示)を網羅。**コミット5**

### Step 6: WeatherWidget ノートロジック抽出+デッドコード除去
- `getDailyWeatherNote` / `getHourlyWeatherNote` としきい値定数(WeatherWidget.tsx:19-23, 250-302)を既存の `weatherInsights.ts` へ移設し、`weatherInsights.test.ts` にケース追加(UV/暑さ/降水/気温差/風の各分岐)。
- デッドコード削除: WeatherWidget.tsx:132-134 の `{!compact ? (null) : null}`。**コミット6**

### Step 7: CalendarWidget イベントロジック抽出
- 新規 `src/widgets/calendar/calendarEvents.ts`: `getNextEvent` / `getEventsForDay` / `formatRelativeStart` / `formatEventTime` / `getMonthDays` / `getWeekDays`(CalendarWidget.tsx:51-101)。
- 新規 `calendarEvents.test.ts`: 終日/時刻付きイベントの優先順位、「あと◯分/◯時間」境界、月グリッド35マスの開始曜日。**コミット7**

### Step 8: Widget 共通フレーム抽出(最大の重複排除)
- 新規 `src/components/WidgetFrame.tsx`: 全ウィジェット共通の「Card + widget-heading(アイコン+タイトル) + StaleBadge + headerExtra + Loading/Error/Empty ゲート + `data && status非error/loading && !isEmpty` で children 描画」を集約。props: `cardClassName` / `icon` / `title` / `status` / `error` / `isEmpty` / `hasData` / `headerExtra` / `children`。
- 適用: Weather / Calendar / News / Stocks / Traffic / PetPhoto(QuickLook側)。PetPhoto の detail モード(ヘッダーなし素の Card)は現状のまま残す。
- **制約**: 出力 DOM のクラス名・構造を変えないこと。`widget-heading` / `widget-heading-icon` 等の測定プローブクラスと `layoutProbeClasses.test.tsx` / `npm run test:layout` が回帰網。News の「更新 HH:mm」、Traffic の時刻表示は `headerExtra` で表現。
- `WidgetFrame.test.tsx` を追加(4状態の出し分け)。**コミット8**

### Step 9: シェル/フックの特異な設計の修正(挙動不変の範囲)
- `src/App.tsx`(1行の再エクスポートシム)を削除し、`main.tsx` から `./app/App` を直接 import。
- `DashboardShell.tsx:22` の `validateDashboardConfig()` レンダー毎実行を `useMemo(..., [])` 化(警告ログの重複出力も解消)。関数自体は config.test.ts が直接使うので export 維持。
- `DashboardShell.tsx:13-18` の `getHighlightedType` のトートロジー(`mode === "stocks" ? "stocks" : mode`)を除去し、displayMode → widget type の解決を registry の `definition.detailDisplayMode` 照合に変更(コーディングルール「レイアウトにウィジェット型分岐を増やさない」に整合)。
- `useWidgetData.ts`: `useQuery<any, WidgetError>` を `unknown` に変更(TS ルール「any 回避」)。localStorage の `readWidgetCache` + zod `validateData` がレンダー毎に走る問題を `useMemo`(key: `config.id`)化。
- `dashboard.integration.test.tsx` / `useWidgetData.test.tsx` / `useRefreshTriggers.test.tsx` が回帰網。**コミット9**(App シム削除と Shell/フック修正は必要なら2コミットに分割)

### Step 10: 提案のみ(今回実施しない)を文書化
- `documents/ImplementationPlan_Addendum.md` に以下を追記(AGENTS.md「将来作業に影響する決定は文書更新」に従う):
  1. **meteocons CDN 依存**: `WeatherWidget.tsx:18` が `https://unpkg.com/@meteocons/svg@0.1.0/flat` を実行時参照。ローカルサーバー(LAN)移行後・オフライン時に天気アイコンが全滅するため、移行前に `public/icons/meteocons/` への自己ホスト化(Material Symbols と同方式)が必要。
  2. **カレンダー now 固定**: `CalendarWidget.tsx:105` の `useMemo(() => new Date(), [])` により相対時刻・日付がマウント時刻で固定。`useNow` フック導入を提案。
  3. **index.html**: `lang="en"` / `title="temp-scaffold"` が残存。
  4. **静的 JSON 生成**: news/traffic JSON は GitHub Actions cron(deploy-pages.yml)生成。ローカルサーバー移行時は generate スクリプトのローカル cron 化が必要。
- **コミット10**

## 運用環境チェックの結論(コード変更不要の確認事項)

- ✅ ベースパスは `VITE_BASE_PATH`(vite.config.ts)+ `resolvePublicAssetPath`(BASE_URL 基準)で抽象化済み。ローカルサーバー(base "/")移行に対応済み。
- ✅ Material Symbols アイコンは自己ホスト済み。秘密情報のバンドルなし。
- ⚠️ meteocons のみ CDN 実行時依存(上記 Step 10-1 に提案として記録)。

## 検証(各コミット後および最終)

AGENTS.md の必須検証:

```
npm run build
npm run test:run
npm run lint
npm run test:layout   # 特に Step 8 (WidgetFrame) 後は必須
```

加えて Step 8 の後に `npm run dev` + ブラウザで 1524x1016 ビューポートを開き、home 表示と各 detail 表示(weather/calendar/traffic/news)でクリッピング・オーバーフローがないことを目視確認。localStorage キャッシュ有無両方の起動を確認。

## 触らないもの

- レイアウト/スタイル(クラス名・DOM 構造は維持。レイアウト変更は documents/ プレビュー承認フローが必要なため本リファクタでは対象外)
- dashboard.config.ts の運用値、プロバイダーポリシー
- openMeteoAdapter.ts(352行だが単一責務+テスト済みのため分割しない)
- 挙動変更3件(決定によりスコープ外、文書化のみ)
