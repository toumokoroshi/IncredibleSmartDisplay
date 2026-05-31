# Incredible Smart Display Implementation Plan

この文書は、現行実装と今後の設計判断の基準をまとめた主要計画書です。
GitHub Pages で静的配信し、Fully Kiosk Browser でリビング常時表示する前提のため、ブラウザへ配信されるコード、設定、JSON、画像はすべて公開可能なものとして扱います。

## 目的

Xiaomi Pad 6S Pro 12.4 inch を横置きで使い、天気、カレンダー、交通、ニュース、ペット写真を 1 画面で確認できるスマートディスプレイを作る。

現行 MVP は以下を重視する。

- 遠目で 3 秒以内に主要情報を把握できる。
- 1 つの Widget 障害で Dashboard 全体を壊さない。
- 外部データは Service 層で検証、正規化してから Widget に渡す。
- 秘密情報、個人 URL、個人カレンダー内容を GitHub Pages frontend に置かない。
- 将来の Worker、GitHub Actions 生成 JSON、静的 JSON への移行余地を残す。

## 技術スタック

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- zod
- Vitest
- React Testing Library
- @testing-library/jest-dom
- lucide-react または既存の Material Symbol アイコン
- GitHub Pages

## 現行 MVP 構成

現行の通常表示対象は以下。

- Header
- WeatherWidget
- CalendarWidget
- TrafficWidget
- NewsWidget
- PetPhotoWidget

StocksWidget は登録済みの拡張候補として維持するが、通常 MVP 画面では `enabled: false` とする。
QuickAreaWidget は初期 MVP の必須 Widget ではない。表示切替は Widget カードのタップで detail 表示へ入る方式を基本とする。

画面構成の目安:

- Header: 10%
- Weather / Calendar row: 42%
- Traffic / News / Pet Photo row: 48%

UI 方針:

- ダークテーマ、カード型 UI。
- 対象端末は 3:2 の横置き。16:9 前提で横幅へ詰め込まない。
- スクロールなしで主要情報を確認できることを優先する。
- Touch target は実用上 44px 以上を目安にする。
- 長い文字列は `line-clamp` または `ellipsis` で崩れを防ぐ。
- EmptyState は Error 扱いしない。
- Stale 状態では前回データを残し、警告表示を併用する。

## 公開配信と個人情報の前提

GitHub Pages で配信される frontend はアクセス制限のない公開静的配信とみなす。

必須ルール:

- API key、OAuth token、refresh token、Webhook URL、個人 iCal URL、個人カレンダー ID、家電操作 token をコード、設定、公開 JSON、テスト fixture に含めない。
- `VITE_` environment variable は frontend bundle に埋め込まれるため秘密情報を置かない。
- Widget は外部 API レスポンス、RSS、交通 API の生 payload、Google Calendar API payload を直接扱わない。
- 個人情報を含むデータは `localStorage` に保存しない。現行 cache は公開可能な WidgetData のみを対象にする。
- `console.warn`、Error message、UI diagnostics に秘密情報や個人 URL を出さない。
- private Google Calendar は初期運用対象外。導入する場合はアクセス制限と最小化表示の方針を別途合意してから実装する。

静的配信で通常しない、または避ける実装:

- GitHub Pages frontend から Google Calendar API へ OAuth 認証付きで直接アクセスする。
- token 付き private iCal URL を frontend config や public JSON に置く。
- private calendar iframe を primary UI として埋め込む。
- 公開 Worker URL が private event title、location、calendar name を無制限に返す。
- RSS や交通 API の provider 固有 payload を Widget へ直接渡す。
- Secrets を `VITE_` に置いて「環境変数だから安全」と扱う。

## データ提供元の方針

Provider は明示的に設定する。`mock` と real data を暗黙に混ぜない。

現行通常運用:

- Weather: `openMeteo`
- Calendar: `localDate`
- Traffic: `staticJson` from `/data/traffic.json`
- News: `staticJson` from `/data/news.json`
- PetPhoto: `staticManifest`
- Stocks: `mock`, disabled

Provider の意味:

- `mock`: 開発、テスト、MVP fallback 用の固定データ。Service 層内に閉じ込める。
- `localDate`: Calendar 専用。通信せず、今日、曜日、明日、週表示のための空 `CalendarData` を返す。
- `staticJson`: GitHub Pages で公開できる正規化済み JSON を読む。
- `workerJson`: Worker が正規化済み WidgetData を返す場合の薄い transport。frontend は Worker 内部の API 種別を知らない。
- `staticManifest`: PetPhoto の公開 manifest を読む。
- `openMeteo`: Weather 用の公開 API。秘密情報を必要としない。

## 抽象境界の方針

`mock`、`localDate`、`staticJson`、`workerJson` は現在の実装経路を表す provider 名であり、長期のアーキテクチャ境界ではない。
将来の拡張では provider 名へ直接依存せず、次の安定した抽象へ依存する。

- Widget は `WidgetData` contract にだけ依存する。
- Dashboard layout は `WidgetDefinition` と `DisplayMode` に依存し、provider 種別を知らない。
- Shared hooks は `WidgetService`、cache policy、query policy に依存し、Google Calendar、RSS、交通 API などの vendor を知らない。
- Service 層は provider adapter を選択してよいが、Widget へ渡す前に必ず `WidgetData` へ正規化する。
- Public JSON、Worker response、mock data はすべて同じ WidgetData contract を満たす。
- Provider 固有の retry、throttle、認証、secret、vendor payload は frontend Widget contract の外側へ閉じ込める。

中間実装に引っ張られないための禁止事項:

- `staticJson` 専用 hook、`workerJson` 専用 layout、`mock` 専用 Widget 分岐を増やさない。
- Shared layer に Widget type や provider type の switch を安易に追加しない。必要な差分は `WidgetDefinition`、service adapter、settings schema へ寄せる。
- `calendar-google`、`traffic-api-x` のような vendor 名を Dashboard の type、DisplayMode、layout class の長期境界にしない。
- 一時的な provider の都合で WidgetData の形を歪めない。必要なら adapter を厚くして WidgetData contract を守る。

データの流れ:

```text
External API / generated JSON / mock / localDate / manifest
  -> Service layer
  -> validation and mapping
  -> WidgetData
  -> Widget rendering
```

## Widget 別データ方針

### Weather

- `openMeteo` を主 provider とする。
- 秘密情報を必要とする天気 API は frontend から直接呼ばない。
- `mock` provider は明示的な fallback またはテスト用途として維持する。
- Open-Meteo 失敗時は cache があれば `stale`。cache がない場合は `error` または明示的 `mock` provider の結果を使う。

### Calendar

現行通常運用は `localDate`。

- `localDate` は network request を行わず、`items: []` を返す。
- イベント 0 件は Calendar の正常状態として扱う。Widget 全体の EmptyState にはしない。
- Quick Look と Detail は今日、曜日、明日、週、月の情報を表示し、private event がなくても役に立つ画面にする。
- Google Calendar iframe は短期検証または public-safe calendar の補助表示に限る。長期 primary UI にしない。
- `week` と `month` は Calendar 内部の view mode とし、`calendar-week` や `calendar-month` を別 Widget や別 Dashboard DisplayMode にしない。

Private Google Calendar の導入は段階制にする。

1. Phase 1: `localDate` のみ。private source へアクセスしない。
2. Phase 2: public-safe な Worker mock payload で `workerJson`、CORS、structured error を検証する。
3. Phase 3: holiday、手動 JSON、busy block など public-safe な calendar-like data を `staticJson` または `workerJson` で扱う。
4. Phase 4: private Google Calendar を検討する。安定した認証付き hosting、home IP allowlist、DDNS など、公開 URL が private data を返さないアクセス制限が必要。
5. Phase 5: title、location、calendar name など詳細項目は、privacy risk と kiosk 運用 risk を明示的に受け入れてから有効化する。`予定あり` のような最小化表示は残す。

### News

- 現行通常運用は `staticJson`。
- `scripts/generate-news-json.mjs` が公開 RSS などから `NewsData` に正規化し、`public/data/news.json` を生成する。
- Frontend は RSS、外部 API payload、provider 固有 payload を直接扱わない。
- 通常 CI は実 RSS へ通信しない。generator の parser と normalizer は fixture test で検証する。

### Traffic

- 現行通常運用は `staticJson`。
- `data-sources/traffic.manual.json` と `scripts/generate-traffic-json.mjs` から `public/data/traffic.json` を生成する。
- 将来 live Worker が必要になった場合のみ `workerJson` provider へ明示的に切り替える。
- Worker success payload は既存の `TrafficData` contract に正規化済みでなければならない。
- 交通 API の status code、provider 固有 status、throttling rule を frontend に漏らさない。

### PetPhoto

- `staticManifest` で `public/pets/manifest.json` を読む。
- 公開 repository に置く写真は公開可能なものだけにする。
- private source directory は repository 外または ignore 対象にし、公開用に選別、圧縮した asset だけを commit する。

### Stocks

- 現行通常表示では disabled。
- 実データ化する場合は `staticJson` または `workerJson` を追加し、market API key を frontend に置かない。

## WorkerJson contract

`workerJson` は特定 API 専用ではなく、正規化済み WidgetData を返す汎用 transport とする。

成功 payload:

```json
{
  "items": []
}
```

実際の形は Widget ごとの `CalendarData`、`NewsData`、`TrafficData`、`StocksData` などの contract に従う。成功 payload を generic `{ "data": ... }` で包まない。

失敗 payload:

```json
{
  "error": {
    "code": "API_RATE_LIMIT",
    "message": "Provider rate limited the request",
    "retryable": true
  }
}
```

Rules:

- `code` は `WidgetErrorCode` の値だけを使う。
- `message` は UI と log に出して安全な文言にする。
- OAuth token、private URL、API key、Webhook URL、provider 内部の throttling detail を含めない。
- Frontend は `mock`、`staticJson`、`workerJson` など frontend provider 名だけで分岐する。
- Tests は fetch を mock し、real external API を呼ばない。

## 型と責務境界

主要共通型:

- `WidgetId`
- `WidgetType`
- `WidgetSize`
- `WidgetStatus`
- `WidgetConfig`
- `WidgetProps`
- `WidgetDataResult`
- `WidgetError`
- `WidgetService`
- `WidgetDefinition`
- `WidgetRegistry`
- `DisplayMode`
- `DashboardCommand`
- `DashboardArea`
- `HeaderStatus`

`WidgetStatus`:

```ts
type WidgetStatus = "idle" | "loading" | "success" | "error" | "stale" | "offline";
```

`WidgetErrorCode`:

```ts
type WidgetErrorCode =
  | "NETWORK_ERROR"
  | "CORS_ERROR"
  | "API_RATE_LIMIT"
  | "AUTH_ERROR"
  | "DATA_EMPTY"
  | "DATA_INVALID"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";
```

Layer responsibilities:

- Widget layer: WidgetData の表示、loading/error/empty/stale の見た目、user action の通知。
- Service layer: fetch、timeout、schema validation、WidgetData への mapping、error normalization。
- Provider utility: `staticJson` と `workerJson` の transport、cache buster、structured error の共通処理。
- Hook layer: TanStack Query、cache restore、stale 判定、refresh trigger。
- Registry layer: `WidgetType` と `WidgetDefinition` の解決、不明 type の fallback。
- Config layer: Dashboard 構成、Widget 配置、provider、更新間隔の定義。

Widget は外部 API response や raw JSON を解釈しない。

## WidgetDefinition

現行の `WidgetDefinition` は Widget 固有の機能境界を持つ。

```ts
type WidgetDefinition<TSettings, TData> = {
  type: WidgetType;
  component: React.ComponentType<WidgetProps<TSettings, TData>>;
  settingsSchema: z.ZodType<TSettings>;
  createService?: () => WidgetService<TSettings, TData>;
  fallbackArea: DashboardArea;
  defaultRefreshIntervalSec: number;
  cacheTtlHours: number;
  validateData: (data: unknown) => data is TData;
  isEmpty: (data: TData) => boolean;
  detailDisplayMode?: DisplayMode;
};
```

Widget 固有の cache TTL、empty 判定、detail 対応、settings schema はここに寄せる。
Shared hook や layout に Widget type switch を増やしすぎない。

## dashboard.config.ts 方針

`dashboard.config.ts` は表示構成と公開可能な provider 設定だけを持つ。

現行 config の要点:

- Weather: `provider: "openMeteo"`
- Calendar: `provider: "localDate"`
- Traffic: `provider: "staticJson"`, `url: "/data/traffic.json"`
- News: `provider: "staticJson"`, `url: "/data/news.json"`
- PetPhoto: `provider: "staticManifest"`
- Stocks: `enabled: false`, `provider: "mock"`

Config に入れてよいもの:

- 公開できる座標、公開 JSON path、表示件数、Widget 順序、表示名。
- 交通路線の表示用 ID、表示名、優先順位。
- cache buster interval など公開して問題ない運用値。

Config に入れてはいけないもの:

- OAuth credential、refresh token、API key。
- private iCal URL、tokenized URL。
- private calendar ID。
- Webhook URL。
- 個人予定の title、location、calendar name。
- 家電操作 token。

## Config validation

起動時に zod などで検証する。

- `widgets[].id` は一意。
- `enabled: true` の Widget は Registry で解決できる。
- `enabled: false` の Widget は描画対象から除外するが、設定の構文検証は行う。
- 不明 Widget type は UnknownWidget として扱い、Dashboard 全体を落とさない。
- 不正 area は `definition.fallbackArea` へ fallback する。
- 負の `refreshIntervalSec` は `definition.defaultRefreshIntervalSec` へ fallback する。
- 不正 settings は該当 Widget のみ ErrorState とし、他 Widget に影響させない。
- Validation warning は秘密情報を含めず、`code`、`widgetId`、`field` を含む構造化 message を推奨する。

## データ取得と cache

TanStack Query の設定は Widget ごとにばらばらにせず、共通 policy に寄せる。

- `refetchOnWindowFocus: false`
- Retry は recoverable error のみ最大 2 回。
- Retry delay は指数 backoff を基本にする。
- Timeout は Service 層で 10 秒を基本にする。
- `refreshIntervalSec` が 0 の場合は自動更新しない。
- API 取得失敗時、前回データがあれば `stale` 表示にする。
- EmptyState は Error 扱いしない。
- Offline 復帰時は `error`、`stale`、`offline` の Widget を優先再取得する。
- 23:59 から 00:00 の日付跨ぎ時は Calendar と Weather を再取得する。

Cache record:

```ts
type WidgetCacheRecord<TData> = {
  data: TData;
  fetchedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  schemaVersion: number;
};
```

Cache rules:

- key は `widget-cache:{widgetId}`。
- `schemaVersion` 不一致や malformed data は復元しない。
- 期限切れでも、取得失敗時は `stale` 表示に使ってよい。
- private personal data を cache 対象にしない。

## DisplayMode と command

`DisplayMode` は Dashboard の表示切替を表す。

```ts
type DisplayMode =
  | "home"
  | "weather"
  | "calendar"
  | "news"
  | "stocks"
  | "traffic"
  | "petPhoto"
  | "smartHome"
  | "system";
```

現行 MVP:

- `home` と各 Widget detail mode を state 切替で表示する。
- Widget カードのタップで `displayMode` を変更する。
- DisplayMode 変更だけでは原則再 fetch しない。
- Calendar の `week` と `month` は Calendar 内部 view mode とする。

将来 command:

```ts
type DashboardCommand =
  | { type: "SET_DISPLAY_MODE"; mode: DisplayMode }
  | { type: "REFRESH_WIDGET"; widgetId: WidgetId }
  | { type: "TRIGGER_ACTION"; actionId: string };
```

Alexa/Webhook は初期 MVP では実装不要。
実装する場合、公開 Webhook URL や認証 secret を frontend に置かない。

## Layout と実機基準

- Primary viewport target は `1524 x 1016` CSS px。
- Fully Kiosk Browser では target device の viewport が想定より狭くなるため、実機では `debug-viewport.html` で確認する。
- `1219 x 812` と `1366 x 912` は fallback 確認対象にする。
- Detail layout は measurement probe class を持つ。

Shared probe classes:

- `widget-detail-root`
- `widget-detail-primary`
- `widget-detail-secondary`
- `widget-detail-list`
- `widget-scroll-region`

Widget-specific examples:

- `weather-detail-root`, `weather-detail-hourly`
- `calendar-detail-root`, `calendar-detail-week`, `calendar-detail-month`
- `traffic-detail-root`, `traffic-detail-lines`
- `news-detail-root`, `news-detail-list`
- `petPhoto-detail-root`, `petPhoto-detail-media`
- `stocks-detail-root`, `stocks-detail-list`

Browser layout automation が使える場合は `collectLayoutProbeResults` と `scripts/layout-probe-check.mjs` を使う。

## GitHub Pages と artifact 運用

- `vite.config.ts` の `base` は repository 名配下でも動くようにする。
- 404 fallback が必要な routing を増やさない。
- Deploy workflow は build、test、lint、必要な generator を通した artifact を公開する。
- News と Traffic の scheduled refresh は、repository history へ JSON commit を増やすより、Actions の作業 directory 内で生成して Pages artifact だけを更新する方式を優先する。
- Generator 失敗または contract test 失敗時は deploy を失敗させ、前回成功した Pages artifact の表示継続に任せる。

## テスト方針

テストは real external API を呼ばない。

優先対象:

- Config validation。
- Registry resolution。
- Service contract と provider validation。
- Static JSON malformed data。
- Worker structured error。
- Cache restore、expiry、schemaVersion。
- Stale fallback。
- Header status aggregation。
- DisplayMode 切替。
- Layout probe class contract。

必須 verification:

```powershell
npm run build
npm run test:run
npm run lint
```

Dependency や lockfile を変更した場合は `package.json` と `package-lock.json` の同期を確認する。

## 完了条件

- `npm run build` が成功する。
- `npm run test:run` が成功する。
- `npm run lint` が成功する。
- 外部 API key なしでローカル起動できる。
- Enabled Widget が画面に表示される。
- Config validation が起動時に行われる。
- 不正 Widget type があっても Dashboard 全体が落ちない。
- Weather は `openMeteo` または明示的 `mock` provider で表示できる。
- Calendar は `localDate` で private data なしに表示できる。
- News と Traffic は公開 `staticJson` で表示できる。
- PetPhoto は `staticManifest` で表示できる。
- Widget カードのタップで DisplayMode を切り替えられる。
- 各 Widget が Loading / Error / Empty / Stale 状態を表示できる。
- Header に Online / Offline、最終更新、errorCount、staleCount が表示される。

## 今後の優先順位

1. 現行 `localDate` Calendar を private data なしでも有用な画面として磨く。
2. News / Traffic の `staticJson` contract と generator test を維持する。
3. `workerJson` は public-safe mock から検証し、private data には使わない。
4. private Calendar は access-control model が固まるまで実装しない。
5. Kiosk 実機 viewport と長時間運用の確認を増やす。
6. 将来の SmartHome / VoiceCommand は secret と command endpoint を frontend から分離して設計する。
