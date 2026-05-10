# ImplementationPlan 追記案

この文書は、既存の [ImplementationPlan.md](/c:/WORKSPACE/IncredibleSmartDisplay/documents/ImplementationPlan.md) を50点から100点に引き上げるための追記案です。
既存方針を否定せず、曖昧な判断点、運用条件、責務境界、テスト戦略を補強することを目的とします。

## この追記案で補強する論点

- 表示モードの挙動定義
- Widget状態遷移の明文化
- Header集計ルールの固定
- Config validationと異常系ハンドリングの責務分離
- Service層 / Widget層 / Registry層の責務整理
- キャッシュ、再取得、オフライン復帰の仕様固定
- テスト戦略のピラミッド化

## 追記 1. 非機能要件

以下を初期MVPの非機能要件として明記する。

- 初回表示は3秒以内を目標とする
- キャッシュが存在する場合、1秒以内に骨格または前回データを表示する
- 1つのWidget障害でDashboard全体を停止させない
- ポーリングやタイマーは画面破棄時に必ず解放し、メモリリークを防ぐ
- Fully Kiosk Browserでの常時表示を前提に、長時間稼働時も致命的な再描画ループを起こさない
- スクロールなしで主要情報を確認できることを最優先とする

## 追記 2. 表示モード仕様

`DisplayMode` は単なる状態型ではなく、表示ルールとセットで定義する。

- `home`: 全Widgetを通常レイアウトで表示する
- `weather`: WeatherWidgetを主表示し、他Widgetは縮小表示または非表示にできる
- `calendar`: CalendarWidgetを主表示し、他Widgetは縮小表示または非表示にできる
- `news`: NewsWidgetを主表示し、他Widgetは縮小表示または非表示にできる
- `stocks`: StocksWidgetを主表示し、他Widgetは縮小表示または非表示にできる
- `smartHome`: 将来拡張用の予約モードとする
- `system`: 将来の保守・設定・診断表示用の予約モードとする

初期MVPでは以下に限定してよい。

- `home` と各主表示モードの切り替えを実装する
- 主表示モードでは対象Widgetを強調表示する
- 画面再マウントではなく、state切り替えで表現する
- QuickAreaのボタンは `displayMode` の変更のみを責務とする

## 追記 3. Widget状態遷移

`WidgetStatus` は見た目のラベルではなく、状態遷移ルールを持つものとして扱う。

### 状態一覧

- `idle`: 初期化直後で未取得
- `loading`: 初回取得中または明示的再取得中
- `success`: 最新データで正常表示中
- `error`: データ取得・変換に失敗し、表示可能な前回データもない
- `stale`: 最新取得は失敗したが、前回データで継続表示できる
- `offline`: ネットワーク断を検知し、取得不能な状態

### 状態遷移ルール

- `idle -> loading`: 初回マウント時
- `loading -> success`: 取得と変換が成功した場合
- `loading -> error`: 取得失敗かつ表示可能なキャッシュがない場合
- `loading -> stale`: 取得失敗だが表示可能なキャッシュがある場合
- `success -> loading`: 手動再取得または定期再取得開始時
- `success -> stale`: 再取得失敗かつ前回データ表示継続時
- `success -> offline`: オフライン検知時かつ再取得不能時
- `offline -> loading`: オンライン復帰後に再取得開始時
- `error -> loading`: リトライ時

### 判定ルール

- `EmptyState` は `success` の一種として扱い、`errorCount` には含めない
- `offline` はネットワーク断の事実を示す状態であり、必ずしも `error` と同義にしない
- `stale` は「表示継続可能だが新鮮ではない」状態とする

## 追記 4. Header集計ルール

`HeaderStatus` の集計基準を明記する。

- `online`: `navigator.onLine` と直近通信結果の双方を参考に判定する
- `lastSyncedAt`: Dashboard全体で最後に成功したWidget取得時刻
- `refreshingCount`: 現在 `loading` 中のWidget数
- `errorCount`: `error` 状態のWidget数
- `staleCount`: `stale` 状態のWidget数

補足ルール:

- `offline` は `errorCount` に含めない
- `EmptyState` は `errorCount` に含めない
- `lastSyncedAt` は「任意Widgetの最終成功時刻」とし、全Widget成功時刻ではない

## 追記 5. 責務分担

各層の責務を固定する。

### Widget層

- 受け取った `Widget用Data型` を表示する
- `loading / error / empty / stale` の見た目を切り替える
- 外部APIレスポンスや生JSONを直接解釈しない

### Hook層

- TanStack Queryの利用
- polling / auto refresh / midnight refresh / offline復帰制御
- cache restore と stale 判定の補助

### Service層

- fetch実行
- timeout制御
- 外部レスポンスのschema parse
- Widget用Data型への変換
- エラーの正規化

### Registry層

- `WidgetType` と `WidgetDefinition` の対応付け
- `settingsSchema` と `component` の解決
- 不明なWidget typeのフォールバック経路提供

### Config層

- Dashboard全体の構成管理
- Widget配置、順序、更新間隔、表示設定の定義

## 追記 6. WidgetDefinition 必須項目

`WidgetDefinition` には最低限以下を持たせる。

```ts
type WidgetDefinition<TSettings, TData> = {
  type: WidgetType;
  component: React.ComponentType<WidgetProps<TSettings, TData>>;
  settingsSchema: z.ZodType<TSettings>;
  createService: () => WidgetService<TSettings, TData>;
  fallbackArea: DashboardArea;
  defaultRefreshIntervalSec: number;
};
```

補足:

- `settingsSchema` を持たせることで、config validation時にWidget単位で検証できる
- `createService` を持たせることで、provider差し替えの責務をRegistry配下へ閉じ込められる
- `fallbackArea` を持たせることで、不正configでもDashboard全体を壊しにくくする

## 追記 7. Config validation 詳細ルール

`dashboard.config.ts` の検証で、以下を追加で保証する。

- `widgets[].id` は一意であること
- `enabled: true` のWidgetは必ずRegistryで解決できること
- `enabled: false` のWidgetは描画対象から除外するが、構文検証は行う
- `order` が重複する場合は元配列順または `id` で安定ソートする
- `refreshIntervalSec` が負数の場合は `definition.defaultRefreshIntervalSec` を採用する
- `area` が不正な場合は `definition.fallbackArea` を採用する
- `settings` が不正な場合はそのWidgetのみ `ErrorState` とし、他Widgetには影響させない

ログ出力ルール:

- `console.warn` には秘密情報を含めない
- URLやtokenは必要に応じてマスクして出力する
- validation warningは `code`, `widgetId`, `field` を含む構造化メッセージを推奨する

## 追記 8. データ取得・キャッシュ仕様

### キャッシュ保存形式

`localStorage` のキャッシュ形式を固定する。

```ts
type WidgetCacheRecord<TData> = {
  data: TData;
  fetchedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  schemaVersion: number;
};
```

### キャッシュ運用ルール

- key は `widget-cache:{widgetId}` とする
- 期限内データは通常表示の候補とする
- 期限切れデータでも、取得失敗時は `stale` 表示に使ってよい
- `schemaVersion` が不一致の場合は破棄する
- malformed dataはキャッシュから復元しない

### 再取得イベント

以下のイベントで再取得方針を固定する。

- 初回マウント時: enabled Widgetを取得する
- 定期更新時: `refreshIntervalSec > 0` のWidgetのみ取得する
- 0:00跨ぎ時: Calendar と Weather を再取得する
- オンライン復帰時: `error`, `stale`, `offline` 状態のWidgetを優先再取得する
- displayMode変更時: 再取得は原則行わず、表示切替のみ行う
- 手動refresh操作追加時: 対象Widgetのみ再取得する

## 追記 9. Weather fallback 仕様

Weatherは唯一の実API接続対象のため、失敗時の挙動を明記する。

- Open-Meteo成功時は `success`
- Open-Meteo失敗時、表示可能キャッシュがあれば `stale`
- Open-Meteo失敗時、キャッシュもなければ `mock fallback` または `error` のどちらにするかを実装前に固定する

初期MVPでは次のどちらかを採用する。

1. `mock fallback` を使い、初回体験を優先する
2. `error + retry導線` とし、実データ優先で正確性を保つ

MVP重視なら 1 を推奨する。

## 追記 10. GitHub Pages / Kiosk 運用補強

- `vite.config.ts` の `base` は repository名配下でも動くように環境依存で解決できる構成にする
- ルーティングを増やさない前提で、404 fallback不要の構成を維持する
- Headerに `last successful fetch` を常時表示できるようにする
- Fully Kiosk Browser前提で `orientation lock`, `zoom抑止`, `auto reload` を考慮する
- 長時間運用を想定し、定期的な `window.location.reload()` を使う場合は `dashboard.config.ts` で制御する

## 追記 11. テスト戦略

テストは列挙型ではなく、ピラミッド型で設計する。

### 方針

- 下層ほど件数を多くし、実行速度を重視する
- 上層ほど件数を絞り、主要導線の保証に集中する
- 外部API実通信は行わない
- flakyなE2Eより、unit / integration / contract testを厚くする

### テストピラミッド

#### 1. Unit Test

最も厚くする層。関数、validator、mapper、hook、状態判定を対象にする。

- `validateConfig.ts`
- `queryPolicy.ts`
- `timeout.ts`
- `cache.ts`
- `useMidnightRefresh.ts`
- `useAutoRefresh.ts`
- Serviceのレスポンス変換ロジック
- error normalization
- Widgetごとの `settingsSchema`

必須観点:

- duplicate id 検出
- invalid area fallback
- invalid refreshIntervalSec fallback
- malformed settings 検出
- cache restore / expiry / schemaVersion
- stale 判定
- offline復帰判定

#### 2. Integration Test

中層。Config、Registry、Hook、Widgetを組み合わせた振る舞いを検証する。

- Dashboardが `dashboard.config.ts` から描画される
- Registry経由でWidgetが正しく解決される
- UnknownWidgetで全体が落ちない
- Query結果に応じて Loading / Error / Empty / Stale が切り替わる
- QuickArea操作で `displayMode` が更新される
- Headerの集計値がWidget状態から正しく算出される

#### 3. Thin E2E / Smoke Test

最上層。件数は最小限とし、主要導線のみを確認する。

- アプリ起動
- Dashboard表示
- 主要Widget表示
- QuickAreaによる表示切替
- build成功
- test成功

初期MVPではブラウザ自動E2Eは必須にしないが、手動スモーク確認手順は残す。

### Service Contract Test

ピラミッドの unit と integration の間を埋めるため、Service contract test を追加する。

- 外部レスポンスまたはmock JSON
- schema parse
- Widget用Data型への変換
- エラー正規化

この層で「外部形式変更の影響」を早期に検知する。

### テスト配置方針

```text
src/
  __tests__/
    config.test.ts
    widgetRegistry.test.ts
    dashboard.integration.test.tsx
    headerStatus.test.ts
    widgetStatus.test.ts

  hooks/
    useAutoRefresh.test.ts
    useMidnightRefresh.test.ts

  services/
    weather/
      weatherService.contract.test.ts
    calendar/
      calendarService.contract.test.ts
    stocks/
      stockService.contract.test.ts
    news/
      newsService.contract.test.ts

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
```

### coverage方針

- coverage 70% は目標値であり、数値のみを追わない
- 次の critical paths は優先的に網羅する
- config validation
- registry resolution
- cache restore
- stale fallback
- error normalization
- displayMode切替

## 追記 12. 追加すべき最低限テスト

既存のテスト一覧に加え、以下を追加する。

1. `widgets[].id` の重複を検出する
2. `HeaderStatus` の `errorCount` / `staleCount` 集計が正しい
3. `EmptyState` が `errorCount` に含まれない
4. `displayMode` 変更時に再fetchしない
5. `0:00` 跨ぎで Weather / Calendar のみ再取得する
6. `schemaVersion` 不一致キャッシュを破棄する
7. malformed cacheを破棄し ErrorState または再取得へ進む
8. `offline -> online` 復帰時に対象Widgetだけ再取得する
9. Serviceが外部レスポンスをWidgetへ直接渡さない
10. `console.warn` に秘密情報が含まれない

## 追記 13. 実装優先順位の修正案

現行の優先順位を少し調整する。

### 推奨順

Step 1:
プロジェクト骨格、型、`dashboard.config.ts`、`validateConfig.ts`、`WidgetRegistry`、`DashboardLayout` を作る。

Step 2:
TanStack Query共通ポリシー、timeout、retry、cache、共通Hookを作る。

Step 3:
mock service と各Widget UIを作る。

Step 4:
WeatherWidgetのみOpen-Meteoに接続する。

Step 5:
Loading / Error / Empty / Stale / UnknownWidget / ErrorBoundary を整える。

Step 6:
自動テストをピラミッド型で追加し、`build` と `test` が通る状態にする。

Step 7:
GitHub Pages向けの `base` 設定と GitHub Actions workflow を追加する。

Step 8:
12.4インチ横置きタブレット向けにUIを最終調整する。

## 追記 14. 文書運用上の注意

- この文書と既存 `ImplementationPlan.md` はUTF-8で管理する
- 実装中に判断が割れやすい箇所は、コードコメントではなく本計画書へ戻して更新する
- 将来追加予定のWidgetは「予約語」ではなく、追加手順と責務分担を守ることで拡張する

## 追記 15. この追記案を既存文書へ反映する場合の差し込み先

- `表示モード` セクションの直後に「表示モード仕様」を追加
- `データ取得共通ポリシー` の直後に「キャッシュ仕様」「再取得イベント」を追加
- `型定義` の直後に「Widget状態遷移」「Header集計ルール」を追加
- `設定バリデーション` の直後に「Config validation 詳細ルール」を追加
- `自動テスト要件` を「テスト戦略」と「最低限テスト一覧」に再編する
- `実装優先順位` を本追記案の順に差し替える
