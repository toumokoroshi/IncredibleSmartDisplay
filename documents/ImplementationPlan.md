React + Vite + TypeScript + Tailwind CSS + TanStack Queryで、リビング据え置き用スマートディスプレイのWebダッシュボードを実装してください。

# 目的

Xiaomi 12.4インチタブレットを横置きで使い、天気・カレンダー・株価・ニュースを1画面で確認できるようにします。

GitHub Pagesで配信し、Fully Kiosk Browserで全画面表示する想定です。

将来的に、家電操作・センサー表示・Alexa等の音声コマンド連携を追加できるよう、Widget単位で拡張しやすい構成にしてください。

まずは動くMVPを優先してください。
ただし、設定検証・エラー耐性・テスト・GitHub Pages運用を最初から最低限組み込んでください。

# 技術スタック

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- zod
- Vitest
- React Testing Library
- @testing-library/jest-dom
- 必要に応じて MSW
- lucide-reactは使用可
- GitHub Pages配信を想定

# 画面構成

12.4インチ横置き向けの固定ダッシュボードUIにしてください。

構成は以下です。

- Header
- Weather | Calendar
- Stocks  | News
- Quick Area

画面比率は以下を目安にしてください。

- Header: 10%
- Weather/Calendar row: 42%
- Stocks/News row: 34%
- Quick Area: 14%

UI方針：

- ダークテーマ
- カード型UI
- 遠目で見やすい文字サイズ
- スクロール前提にしない
- 1画面完結を基本にする
- タッチ対象は大きめにする
- 主要情報は3秒以内に把握できる構成にする

# 表示境界条件

以下を実装してください。

- Headerの時刻は48px以上を目安にする
- Widget本文の最小フォントサイズは18pxを目安にする
- QuickAreaのボタン高さは44px以上にする
- Newsタイトルは最大2行で省略する
- Calendarタイトルは最大1〜2行で省略する
- 長い文字列はellipsisまたはline-clampで崩れないようにする
- データ0件時はEmptyStateを表示する
- EmptyStateはError扱いしない
- 23:59→00:00の日付跨ぎ時にCalendarとWeatherを再取得する
- オフライン復帰時は自動で再取得を試みる

# 初期実装Widget

以下を初期実装してください。

- Header
- WeatherWidget
- CalendarWidget
- StocksWidget
- NewsWidget
- QuickAreaWidget

将来拡張の設計枠として、以下を追加しやすい構成にしてください。

- SmartHomeWidget
- SensorWidget
- MemoWidget
- GarbageDayWidget
- TrafficWidget
- VoiceCommand / Alexa連携

# 設計方針

以下を必ず守ってください。

- Widgetは独立した機能単位とする
- Widgetはdashboard.config.tsから生成する
- WidgetRegistry方式でWidget typeとComponentを対応させる
- Widgetは外部APIレスポンスを直接扱わない
- Service層でWidget用Data型に変換する
- provider差し替えを前提にAdapterパターンを使える構成にする
- 新Widget追加時は widgets/{name}/ と services/{name}/ を追加し、registryとconfigに登録するだけに近い構成にする
- 1つのWidgetが壊れてもDashboard全体を壊さない
- Widgetごとに loading / success / error / stale / offline を扱う
- APIキーや個人URLはコードに含めない
- 秘密情報をconsoleに出さない

# Widget追加チェックリスト

将来Widgetを追加するとき、以下の流れで追加できるようにしてください。

1. widgets/{widgetName}/ を作る
2. Widget Componentを作る
3. types.tsでSettings/Data型を定義する
4. services/{widgetName}/ にServiceを作る
5. {widgetName}.definition.tsを作る
6. WidgetRegistryに登録する
7. dashboard.config.tsにWidgetConfigを追加する
8. Widget単体テストを追加する
9. config validationの対象に含める

# 表示モード

表示切替と将来のAlexa連携に備えて、DisplayModeを定義してください。

例：

type DisplayMode =
  | "home"
  | "weather"
  | "calendar"
  | "news"
  | "stocks"
  | "smartHome"
  | "system";

QuickAreaWidgetのボタンからdisplayModeを切り替えられるようにしてください。

将来、AlexaやWebhookから以下のようなCommandを受け取れる設計余地を残してください。

type DashboardCommand =
  | { type: "SET_DISPLAY_MODE"; mode: DisplayMode }
  | { type: "REFRESH_WIDGET"; widgetId: WidgetId }
  | { type: "TRIGGER_ACTION"; actionId: string };

初期MVPではAlexa連携そのものは実装不要です。
ただし、型や設計枠は用意してください。

DashboardCommandのversioningは初期MVPでは不要です。
Alexa/Webhook連携を実装する段階で導入できる余地だけ残してください。

# データ方針

初期実装では以下の方針にしてください。

- WeatherはOpen-Meteoに接続
- Calendarはmock service
- Stocksはmock service
- Newsはmock service
- 後でiCal / RSS / Finnhub / JSON / Cloudflare Worker / GitHub Actions生成JSONに差し替えやすいService層にする

外部APIレスポンスをWidgetへ直接渡さないでください。

必ず以下の流れにしてください。

External API / mock / JSON
  ↓
Service層
  ↓
Widget用Data型
  ↓
Widget表示

# データ取得共通ポリシー

TanStack Queryの設定をWidgetごとにバラバラにせず、共通ポリシーとして管理してください。

要件：

- refetchOnWindowFocus: false
- retryはrecoverableなエラーのみ最大2回
- retryDelayは指数バックオフを基本にする
- timeoutはService層で10秒を基本とする
- RSS相当の取得は15秒まで許容してよい
- refreshIntervalSecをWidgetごとの再取得間隔として使う
- refreshIntervalSecが0の場合は自動更新しない
- WidgetごとのrefreshIntervalSecをQuery設定より優先する
- API取得失敗時、前回データがあればstale表示にする
- EmptyStateはError扱いしない
- 取得済みデータがある場合、表示更新は2秒以内を目標にする
- 外部API取得時間はtimeoutで制御する

# 型定義

以下の共通型を用意してください。

- WidgetId
- WidgetType
- WidgetSize
- WidgetStatus
- WidgetConfig
- WidgetProps
- WidgetDataResult
- WidgetError
- WidgetService
- WidgetDefinition
- WidgetRegistry
- DisplayMode
- DashboardCommand
- DashboardArea
- HeaderStatus

WidgetStatusは以下を含めてください。

type WidgetStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "stale"
  | "offline";

WidgetConfigは少なくとも以下を持つようにしてください。

type WidgetConfig<TSettings = Record<string, unknown>> = {
  id: WidgetId;
  type: WidgetType;
  title: string;
  enabled: boolean;
  size: WidgetSize;
  refreshIntervalSec: number;
  order: number;
  area?: DashboardArea;
  settings?: TSettings;
};

DashboardAreaは以下を想定してください。

type DashboardArea =
  | "header"
  | "main-left"
  | "main-right"
  | "sub-left"
  | "sub-right"
  | "quick-area"
  | "detail";

HeaderStatusは以下を想定してください。

type HeaderStatus = {
  online: boolean;
  lastSyncedAt?: ISODateTimeString;
  refreshingCount: number;
  errorCount: number;
  staleCount: number;
};

# dashboard.config.ts

dashboard.config.ts を作成してください。

構造は以下です。

DashboardConfig
├ app
├ layout
├ theme
├ widgets
└ commands

設定例：

export const dashboardConfig = {
  app: {
    name: "Living Dashboard",
    locale: "ja-JP",
    timezone: "Asia/Tokyo",
    defaultDisplayMode: "home",
    autoReload: {
      enabled: true,
      intervalMinutes: 360
    }
  },

  layout: {
    type: "living-room-landscape",
    gapPx: 12,
    paddingPx: 16
  },

  theme: {
    mode: "dark",
    density: "comfortable",
    fontScale: 1.0,
    enableBurnInProtection: true
  },

  widgets: [
    {
      id: "weather-main",
      type: "weather",
      title: "Weather",
      enabled: true,
      size: "large",
      refreshIntervalSec: 1800,
      order: 1,
      area: "main-left",
      settings: {
        provider: "openMeteo",
        latitude: 35.6812,
        longitude: 139.7671,
        locationName: "Tokyo",
        units: "metric",
        showTomorrow: true,
        showHumidity: true,
        showWind: false
      }
    },
    {
      id: "calendar-main",
      type: "calendar",
      title: "Calendar",
      enabled: true,
      size: "large",
      refreshIntervalSec: 600,
      order: 2,
      area: "main-right",
      settings: {
        provider: "mock",
        daysAhead: 2,
        maxTodayEvents: 4,
        maxTomorrowEvents: 2,
        showAllDayEvents: true
      }
    },
    {
      id: "stocks-main",
      type: "stocks",
      title: "Markets",
      enabled: true,
      size: "medium",
      refreshIntervalSec: 600,
      order: 3,
      area: "sub-left",
      settings: {
        provider: "mock",
        symbols: ["^N225", "^IXIC", "^GSPC", "USDJPY=X"],
        maxItems: 5,
        showCurrency: true,
        showMarketState: true
      }
    },
    {
      id: "news-main",
      type: "news",
      title: "News",
      enabled: true,
      size: "medium",
      refreshIntervalSec: 1800,
      order: 4,
      area: "sub-right",
      settings: {
        provider: "mock",
        feeds: [
          { id: "nhk", name: "NHK" },
          { id: "itmedia", name: "ITmedia" },
          { id: "hackernews", name: "Hacker News" }
        ],
        maxItems: 5,
        showSource: true,
        showPublishedAt: true
      }
    },
    {
      id: "quick-area-main",
      type: "quickArea",
      title: "Quick",
      enabled: true,
      size: "wide",
      refreshIntervalSec: 0,
      order: 5,
      area: "quick-area",
      settings: {
        buttons: [
          { label: "Home", displayMode: "home" },
          { label: "Weather", displayMode: "weather" },
          { label: "Calendar", displayMode: "calendar" },
          { label: "News", displayMode: "news" },
          { label: "Markets", displayMode: "stocks" }
        ]
      }
    }
  ],

  commands: {
    enabled: false,
    acceptedSources: ["alexa", "webhook", "manual"],
    defaultTimeoutSec: 300
  }
};

# 設定バリデーション

dashboard.config.ts は zod などで起動時に検証してください。

要件：

- enabled=true のWidget typeがWidgetRegistryに存在することを検証する
- 不正なWidget typeはUnknownWidgetとして表示し、Dashboard全体は落とさない
- areaが不正な場合はfallback areaに配置する
- refreshIntervalSecが0未満の場合はdefault値に丸める
- orderが不正な場合もfallbackできるようにする
- settingsが不正な場合は該当WidgetのみErrorStateを表示する
- 検証結果はconsole.warnに出してよい
- console.warnにはAPIキー、iCal URL、Webhook URLなどの秘密情報を出さない
- config validationのテストを追加する

# 各Widgetの入出力

各WidgetはSettingsとDataを分けてください。

WeatherWidget:
  input: WeatherSettings
  output: WeatherData

CalendarWidget:
  input: CalendarSettings
  output: CalendarData

StocksWidget:
  input: StocksSettings
  output: StocksData

NewsWidget:
  input: NewsSettings
  output: NewsData

QuickAreaWidget:
  input: QuickAreaSettings
  output: 原則不要

日時はISO 8601文字列に統一してください。

例：

type ISODateTimeString = string;
type ISODateString = string;

欠損しうる値はoptionalにしてください。

例：

- currentTempC?: number
- publishedAt?: string
- imageUrl?: string
- changePercent?: number

# エラー表示仕様

以下を実装してください。

- Widget単位でLoading表示
- Widget単位でError表示
- Widget単位でEmptyState表示
- 前回データがある場合はstale表示
- 取得失敗してもDashboard全体を壊さない
- HeaderにOnline/Offline、最終更新、errorCount、staleCountを表示する
- Headerにlast successful fetchまたは最終同期時刻を表示する
- Empty状態はError扱いにしない
- Widget単位のErrorBoundaryを用意する
- Dashboard全体のErrorBoundaryも用意する
- ErrorBoundary発火時は該当WidgetのみErrorStateを表示し、他Widgetは表示継続する
- Dashboard全体のErrorBoundary発火時は簡易エラー画面を表示する

エラーコードは少なくとも以下を想定してください。

type WidgetErrorCode =
  | "NETWORK_ERROR"
  | "CORS_ERROR"
  | "API_RATE_LIMIT"
  | "AUTH_ERROR"
  | "DATA_EMPTY"
  | "DATA_INVALID"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

前回データの保持にはlocalStorageを使って構いません。

キャッシュキー例：

widget-cache:{widgetId}

キャッシュ有効期限の目安：

- Weather: 3時間
- Calendar: 24時間
- Stocks: 12時間
- News: 12時間

期限切れでも完全に捨てず、古いデータとしてstale表示できるようにしてください。

# セキュリティ/秘密情報管理

以下を守ってください。

- 公開リポジトリ前提で、秘匿情報を持たない構成にする
- APIキーをコードに含めない
- 個人iCal URLをコードに含めない
- Webhook URLをコードに含めない
- 家電操作トークンをコードに含めない
- .envを使う場合、VITE_ prefixの値はフロントエンドに埋め込まれ公開される前提で扱う
- 秘密情報はVITE_にも置かない
- 初期MVPではWeather以外はmock serviceでよい
- 将来、秘密情報が必要なAPIはCloudflare WorkerやGitHub Actions経由で扱える設計にする
- CSPは初期MVPでは厳密実装不要。ただし外部接続先をService層に閉じ込め、将来CSPを導入しやすくする

# GitHub Pages運用

GitHub Pages配信を前提にしてください。

要件：

- vite.config.tsでbaseを設定可能にする
- repository名配下でも動くようにbase設定を考慮する
- GitHub Actionsで npm ci / npm run build / npm run test:run を実行する
- buildとtestが成功した場合のみdeployする
- GitHub Pages向けのworkflowファイルを追加する
- 静的JSONを読む構成に将来拡張しやすくする
- SPAルーティングは初期MVPでは複雑にしない
- 404 fallbackが必要になる構成は避けるか、必要なら最小限で対応する
- Headerにlast successful fetchまたは最終更新時刻を表示する

# ディレクトリ構成

以下を基本にしてください。

src/
  app/
    App.tsx

  config/
    dashboard.config.ts
    validateConfig.ts

  layouts/
    DashboardLayout.tsx
    WidgetGrid.tsx

  widgets/
    weather/
      WeatherWidget.tsx
      weather.definition.ts
      types.ts
      index.ts
    calendar/
      CalendarWidget.tsx
      calendar.definition.ts
      types.ts
      index.ts
    stocks/
      StocksWidget.tsx
      stocks.definition.ts
      types.ts
      index.ts
    news/
      NewsWidget.tsx
      news.definition.ts
      types.ts
      index.ts
    quickArea/
      QuickAreaWidget.tsx
      quickArea.definition.ts
      types.ts
      index.ts

  services/
    weather/
      weatherService.ts
    calendar/
      calendarService.ts
    stocks/
      stockService.ts
    news/
      newsService.ts

  hooks/
    useWidgetData.ts
    useAutoRefresh.ts
    useMidnightRefresh.ts

  components/
    Card.tsx
    ErrorState.tsx
    EmptyState.tsx
    LoadingState.tsx
    StaleBadge.tsx
    UnknownWidget.tsx
    ErrorBoundary.tsx

  types/
    common.ts
    widget.ts
    command.ts
    dashboard.ts

  utils/
    date.ts
    format.ts
    cache.ts
    queryPolicy.ts
    timeout.ts

  test/
    setup.ts
    mocks/
      weather.ts
      calendar.ts
      stocks.ts
      news.ts

# 自動テスト要件

Vitest + React Testing Library + @testing-library/jest-dom を導入してください。
必要に応じてMSWを使ってください。

テストでは外部APIへ実通信しないでください。
APIキーや個人URLはテストコードにも含めないでください。

最低限、以下のテストを実装してください。

1. dashboard.config.ts に定義された enabled Widget の type が WidgetRegistry に存在する
2. config validationが不正なWidget typeを検出する
3. config validationが不正なareaやrefreshIntervalSecをfallbackする
4. WidgetRenderer が登録済みWidgetを正しく描画する
5. 未登録Widget typeの場合、UnknownWidgetを表示しDashboard全体を落とさない
6. Dashboard全体がdashboard.config.tsから描画される
7. WeatherWidget がmock WeatherDataを表示する
8. CalendarWidget が今日/明日のmock予定を表示する
9. StocksWidget がmock銘柄情報を表示する
10. NewsWidget がmockニュース見出しを表示する
11. QuickAreaWidget のボタン押下で displayMode 変更ハンドラが呼ばれる
12. 各Widgetが loading 状態を表示できる
13. 各Widgetが error 状態を表示できる
14. 各Widgetが EmptyState を表示できる
15. stale状態では前回データと警告表示を併用する
16. malformed dataを受け取ったときに該当WidgetがErrorStateになる
17. timeout時にErrorまたはStaleになる
18. offline想定時に前回データがあればstale表示になる
19. Widget単位のErrorBoundaryで該当WidgetのみErrorStateになる
20. npm run build と npm run test:run が成功する

テスト構成は以下を基本にしてください。

src/
  __tests__/
    config.test.ts
    widgetRegistry.test.ts
    dashboard.integration.test.tsx

  widgets/
    weather/
      WeatherWidget.test.tsx
    calendar/
      CalendarWidget.test.tsx
    stocks/
      StocksWidget.test.tsx
    news/
      NewsWidget.test.tsx
    quickArea/
      QuickAreaWidget.test.tsx

  test/
    setup.ts
    mocks/
      weather.ts
      calendar.ts
      stocks.ts
      news.ts

coverageレポートを出せる構成にしてください。
初期MVPではcoverage 70%を目標にし、将来的に80%を目指せる構成にしてください。
coverage 80%を初期必須条件にはしなくてよいです。

# package.json scripts

以下のようなスクリプトを用意してください。

{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint ."
  }
}

# 完了条件

以下を満たしてください。

- npm run build が成功する
- npm run test:run が成功する
- TypeScriptエラーがない
- 外部APIキーなしでローカル起動できる
- dashboard.config.tsに定義されたenabled Widgetが画面に表示される
- dashboard.config.tsがzod等で起動時検証される
- 不正Widget typeがあってもDashboard全体が落ちない
- WeatherWidgetはOpen-Meteoまたはmock fallbackで表示できる
- Calendar/Stocks/Newsはmock serviceで表示できる
- QuickAreaでdisplayModeを切り替えられる
- 各WidgetがLoading/Error/Empty/Stale状態を表示できる
- HeaderにOnline/Offline、最終更新、errorCount、staleCountが表示される
- GitHub Pages用のbase設定とActions workflowが用意されている
- coverageレポートを出せる
- 主要テストが通る

# MVPデモシナリオ

3分以内に以下を確認できる状態にしてください。

1. ローカルでnpm run devを実行する
2. Dashboardが表示される
3. Headerに時刻と状態が表示される
4. Weather/Calendar/Stocks/News/QuickAreaが表示される
5. QuickAreaでWeather/Calendar/News/Markets/Homeを切り替えられる
6. mockデータでCalendar/Stocks/Newsが表示される
7. WeatherがOpen-Meteoまたはmock fallbackで表示される
8. 意図的に不正Widget typeを入れてもUnknownWidgetになりDashboard全体は落ちない
9. npm run build が成功する
10. npm run test:run が成功する

# 初期MVPでは後回しでよいもの

以下は初期MVPでは実装不要です。

- 実際のAlexa連携
- 実際の家電操作
- 実際のGoogle Calendar API認証
- 実際のRSS取得
- 実際のFinnhub接続
- Cloudflare Worker実装
- CSPの厳密設計
- WCAG AA完全準拠
- Playwright等によるE2Eテスト
- Kiosk Browser実機の自動テスト
- 24時間耐久試験
- DashboardCommand versioning

ただし、将来追加しやすい設計にしてください。

# 実装優先順位

一度に作り込みすぎず、以下の順で進めてください。

Step 1:
プロジェクト骨格、型、dashboard.config.ts、config validation、WidgetRegistry、DashboardLayoutを作る。

Step 2:
mock serviceと各Widget UIを作る。

Step 3:
WeatherWidgetだけOpen-Meteoに接続する。

Step 4:
Loading/Error/Empty/Stale/UnknownWidget/ErrorBoundaryを整える。

Step 5:
TanStack Queryの共通ポリシー、timeout、retry、cacheを整える。

Step 6:
自動テストを追加し、buildとtestが通る状態にする。

Step 7:
GitHub Pages用のbase設定とGitHub Actions workflowを追加する。

Step 8:
12.4インチ横置きタブレット向けにUIを調整する。

まずは動くMVPを優先してください。