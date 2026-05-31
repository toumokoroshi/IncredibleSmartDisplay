# Implementation Plan Addendum

この文書は [ImplementationPlan.md](/c:/WORKSPACE/IncredibleSmartDisplay/documents/ImplementationPlan.md) を補足する判断ログと運用ルールです。
本文と矛盾する場合は、より新しく具体的な privacy / static hosting 方針を優先し、両方の文書を更新してください。

## 1. API migration review outcome

Mock から API へ移行する過程で、GitHub Pages frontend が private Google Calendar へ直接アクセスする設計は不適切だと判断した。

理由:

- GitHub Pages は公開静的配信であり、bundle、config、public asset、generated JSON は閲覧可能。
- `VITE_` environment variable は秘密情報ではなく公開値。
- Google Calendar private data は、event title、location、calendar name、calendar ID、参加者、予定の存在自体が個人情報になりうる。
- Fully Kiosk Browser は家庭内端末向けの表示手段であり、配信元 URL のアクセス制限を自動的に提供しない。
- Public Worker URL が private data を返すだけでは、frontend から直接呼ぶ場合と本質的な露出リスクが残る。

結論:

- 現行 frontend は public-safe data のみ扱う。
- Private data は、アクセス制限、最小化、cache、log、error message、端末紛失時の影響を検討してから導入する。
- Calendar は `localDate` を現行通常運用とし、private Google Calendar access は将来 phase に分離する。

## 2. Calendar privacy rollout

Calendar private data は以下の phase で導入判断する。

### Phase 1: local date only

- `dashboard.config.ts` の primary Calendar は `provider: "localDate"`。
- Network request を行わない。
- `CalendarData.items` は空配列でよい。
- Quick Look と Detail は今日、曜日、明日、週、月を表示する。
- Event 0 件は正常状態。Calendar Widget の EmptyState にはしない。
- Google Calendar API、private iCal URL、OAuth token、event title、location、calendar name は対象外。

### Phase 2: public-safe worker mock

- Worker mock endpoint は `workerJson`、CORS、structured error、deploy routing の検証に限る。
- Payload は dummy event または minimized busy block のみ。
- Private Google Calendar access はまだ行わない。

### Phase 3: public-safe calendar-like data

- Holiday、手動 JSON、公開可能な予定、minimized busy block を `staticJson` または `workerJson` で扱える。
- Private title、location、calendar name はまだ扱わない。

### Phase 4: private calendar candidate

Private Google Calendar access は次のいずれかの access-control model が実機で成立した場合のみ検討する。

- Stable authenticated hosting。
- Home IP allowlisting with DDNS。
- Cloudflare Access などの認証付き gateway。
- 家庭内 network からのみ到達できる local service。
- その他、公開 URL が private calendar data を返さない構成。

Worker secrets は OAuth credential、refresh token、calendar identifier を保持してよいが、frontend へ private data を返す endpoint はアクセス制限が必須。

### Phase 5: detailed private fields

Event title、location、calendar name、複数 calendar、rich week/month view は、privacy risk と kiosk operation risk を明示的に受け入れてから有効化する。
`予定あり` のような minimized display mode は残す。

## 3. Calendar UI direction

- Calendar の home quick-look と detail view は first-party app layout とする。
- Google Calendar iframe は短期検証または public-safe calendar の補助表示に限る。
- iframe は layout probe で検証しづらく、kiosk reliability の primary surface にしない。
- `week` と `month` は Calendar 内部 view mode とする。
- `calendar-week` と `calendar-month` を別 Widget、別 route、別 DisplayMode に分けない。
- Week は operational default。Month は selected-day rail を持ち、直近確認の用途を失わない。

## 4. Public data contracts

Frontend は WidgetData contract に正規化済みの public-safe payload だけを受け取る。

Provider names are adapter choices, not architecture boundaries.
`staticJson` and `workerJson` should remain thin transports over the same WidgetData contract. If a future implementation needs GitHub Actions artifacts, Cloudflare Workers, home LAN services, authenticated hosting, or another source, add or replace adapters without changing Widget rendering contracts, Dashboard display modes, or shared query/cache hooks.

Design rules:

- Depend on `WidgetData`, `WidgetService`, `WidgetDefinition`, and provider-neutral utilities.
- Treat `mock`, `localDate`, `staticJson`, and `workerJson` as replaceable adapters.
- Keep vendor-specific fields and response shapes outside WidgetData.
- Prefer a new adapter or mapper over leaking a temporary source shape into components.
- When a temporary helper starts to carry reusable behavior, rename or split it into a provider-neutral utility before other widgets depend on it.
- A provider migration should be mostly service tests plus config changes. It should not require Dashboard layout or Widget component rewrites unless the product surface itself changes.

### Static JSON

`staticJson` は GitHub Pages で公開してよい JSON を読む provider。

Rules:

- API key、private URL、token、認証付き feed、private event を含めない。
- JSON は Widget ごとの data contract に合わせる。
- Frontend service は JSON を再検証し、malformed data を `DATA_INVALID` として扱う。
- `generatedAt` を持てる Widget は artifact freshness の表示や test に利用する。
- Static JSON は public cache される前提で設計する。

### Worker JSON

`workerJson` は live endpoint 用の薄い transport。

Rules:

- Success payload は正規化済み WidgetData。
- Failure payload は structured error。
- Frontend は Worker 内部の Google Calendar、RSS、交通 API、market API などを知らない。
- Worker error message は secret、private URL、token、provider 内部 detail を含めない。
- `workerJson` endpoint が private data を返す場合は access control が必須。

Structured error:

```json
{
  "error": {
    "code": "API_RATE_LIMIT",
    "message": "Provider rate limited the request",
    "retryable": true
  }
}
```

`code` は frontend の `WidgetErrorCode` に合わせる。

## 5. News operation

現行の News real-data path:

```text
Public RSS or public API
  -> scripts/generate-news-json.mjs
  -> normalized NewsData
  -> public/data/news.json
  -> frontend staticJson provider
  -> NewsWidget
```

Rules:

- Frontend は RSS を直接 fetch しない。
- Generator は secret、API key、private feed を前提にしない。
- `NEWS_FEEDS_JSON`、`NEWS_MAX_ITEMS`、`NEWS_OUTPUT_PATH`、`NEWS_TIMEOUT_MS` で運用時に調整する。
- Generated JSON は新しい記事順に並べる。
- Contract tests は shape、item count、date validity、descending date order、unique ids、placeholder text absence を確認する。
- 通常 CI は real RSS へ通信しない。Parser と normalizer は fixture test で検証する。

## 6. Traffic operation

現行の Traffic real-data path:

```text
data-sources/traffic.manual.json
  -> scripts/generate-traffic-json.mjs
  -> normalized TrafficData
  -> public/data/traffic.json
  -> frontend staticJson provider
  -> TrafficWidget
```

`TrafficData` minimum contract:

```json
{
  "generatedAt": "2026-05-30T03:30:00.000Z",
  "updatedAt": "2026-05-30T12:30:00+09:00",
  "lines": [
    {
      "id": "jr-yamanote",
      "name": "山手線",
      "operator": "JR東日本",
      "status": "normal",
      "updatedAt": "2026-05-30T12:29:00+09:00"
    }
  ]
}
```

Rules:

- `lines[].status` は `"normal" | "delayed" | "partiallyDelayed" | "suspended" | "unknown"`。
- Manual source は対象路線を原則削除せず、未確認は `unknown` とする。
- External traffic API や Worker 化は次 phase。Frontend の通常 provider は `staticJson` のまま。
- `workerJson` へ移行する場合も success payload は `TrafficData`。
- Frontend は provider-specific status code や provider payload を受け取らない。

## 7. Artifact-only refresh

News と Traffic の scheduled refresh は、当面 Pages artifact 生成時に JSON を生成する方式を優先する。

Rules:

- Deploy workflow は push、manual dispatch、scheduled run で実行できる。
- Scheduled run は 15 分ごとを目標にできるが、外部 feed の負荷と鮮度要件を見て調整する。
- Artifact-only 運用では repository history へ generated JSON commit を積まない。
- Each run は fresh checkout から始まるため、News と Traffic は同じ run で毎回生成する。
- Generator 失敗または contract test 失敗時は deploy を失敗させる。
- 前回成功した Pages artifact が表示継続することを運用上の fallback とする。

## 8. Cache and personal data

Current cache は public-safe WidgetData のみを対象にする。

Rules:

- Private personal data を `localStorage` に保存しない。
- Cache key は `widget-cache:{widgetId}`。
- `schemaVersion` 不一致、malformed data、contract mismatch は復元しない。
- Static JSON や Worker JSON の payload は service validation 後に cache 候補にする。
- Future private calendar では cache 無効、短 TTL、busy block のみなど、別 policy を設ける。

## 9. Logging and diagnostics

Logs は公開されうる前提で扱う。

禁止:

- API key、token、private URL、private iCal URL、Webhook URL。
- Google Calendar event title、location、calendar name。
- Worker 内部 provider error payload の丸出し。
- Request header や Authorization header。

推奨:

- `code`, `widgetId`, `field`, `provider`, `retryable` のような構造化された公開安全な情報。
- URL は必要なら origin や provider name までに抑える。
- Validation error は field 名中心にし、入力値全文を出さない。

## 10. Layout probes

Detail layout work は measurement probe class を維持する。

Shared classes:

- `widget-detail-root`
- `widget-detail-primary`
- `widget-detail-secondary`
- `widget-detail-list`
- `widget-scroll-region`

Widget-specific classes:

- `weather-detail-root`, `weather-detail-top`, `weather-detail-now`, `weather-detail-daily`, `weather-detail-note`, `weather-detail-hourly`
- `calendar-detail-root`, `calendar-detail-next`, `calendar-detail-summary`, `calendar-detail-week`, `calendar-detail-month`, `calendar-detail-selected-day`
- `traffic-detail-root`, `traffic-detail-summary`, `traffic-detail-impact`, `traffic-detail-lines`
- `news-detail-root`, `news-detail-featured`, `news-detail-list`
- `petPhoto-detail-root`, `petPhoto-detail-media`
- `stocks-detail-root`, `stocks-detail-list`

Primary viewport is `1524 x 1016` CSS px.
Pass criteria:

- Important non-scroll regions have `scrollHeight <= clientHeight + 1`.
- Important child bounds remain inside parent card.
- Horizontal overflow exists only in regions marked as scroll regions.

Use `collectLayoutProbeResults` from `src/utils/layoutProbe.ts` when browser automation is available.

## 11. Weather layout changes

Weather widget layout changes require a comparison/debug HTML preview in `documents/` before applying the app change.
The preview should show the target 3:2 viewport and the expected quick-look or detail layout variants.

## 12. Test strategy

Do not call real external API in unit or integration tests.

Required coverage focus:

- Service contract validation for `staticJson` and `workerJson`.
- Structured Worker error normalization.
- Malformed generated JSON rejection.
- Calendar `localDate` behavior with empty event list.
- Calendar `week` / `month` internal view behavior.
- Cache restore, expiry, schemaVersion mismatch.
- Header error and stale counts.
- DisplayMode change without unintended refetch.
- Layout probe class contract.

## 13. Documentation maintenance

When implementation decisions change, update documents in the same change.

Update [ImplementationPlan.md](/c:/WORKSPACE/IncredibleSmartDisplay/documents/ImplementationPlan.md) when:

- Widget provider policy changes.
- Data source or privacy boundary changes.
- Dashboard config semantics change.
- A new public JSON or Worker contract is introduced.
- A temporary MVP path becomes a stable extension point.

Update this addendum when:

- A risk decision or rollout phase changes.
- An operational workflow changes.
- A rejected design becomes acceptable, or an accepted design is later rejected.

Avoid leaving obsolete guidance such as "Calendar/News/Traffic are mock" when the implementation has moved to `localDate` or `staticJson`.
