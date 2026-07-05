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
- Home IP allowlisting with DDNS and kiosk-safe IPv4 operation。
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

### Manual data staleness detection

`data-sources/traffic.manual.json` は人手更新前提のため、構文的に正しいまま内容だけ古くなっても generator と deploy は正常終了してしまう。「壊れていない」と「新しい」を区別して検知する。

Rules:

- `scripts/generate-traffic-json.mjs` は全 `lines[].updatedAt` のうち最も古いものを閾値(目安 30 日)と比較する。閾値を超えた場合、deploy は失敗させず warning のみ出す。deploy を失敗させると前回成功 artifact がさらに古いまま残り続け逆効果になるため。
- Per-line `updatedAt` だけでは「人間が実際に中身を見直したか」までは保証できない。ファイル全体に対する `confirmedAt` のような人手更新フィールドを設け、これが閾値を超えた場合も同様に warning を出す運用を検討する。
- Warning は当面 GitHub Actions のログ出力に留め、Header UI への反映は過剰反応を避けるため見送る。

## 7. Artifact-only refresh

News と Traffic の scheduled refresh は、当面 Pages artifact 生成時に JSON を生成する方式を優先する。

Rules:

- Deploy workflow は push、manual dispatch、scheduled run で実行できる。
- Scheduled run は 15 分ごとを目標にできるが、外部 feed の負荷と鮮度要件を見て調整する。
- Artifact-only 運用では repository history へ generated JSON commit を積まない。
- Each run は fresh checkout から始まるため、News と Traffic は同じ run で毎回生成する。
- Generator 失敗または contract test 失敗時は deploy を失敗させる。
- 前回成功した Pages artifact が表示継続することを運用上の fallback とする。

### Failure visibility

前回成功 artifact の表示継続は、失敗が起きても kiosk 画面上は何も変わらないことを意味する。そのため人間が失敗に気づく手段を別途明記する。

Rules:

- 新しい通知インフラ(Slack/Discord webhook など)は作らない。GitHub の標準機能である workflow failure の email 通知に依存する。運用側で repository の notification 設定が有効になっていることを前提とする。
- 通知が来た際の一次対応は、generator のログを確認し、外部 feed 側の変更や manual data の記法ミスを疑うことから始める。
- 連続失敗が続く場合、原因が外部要因(feed 仕様変更など)か内部要因(manual json の記法ミス)かをまず切り分ける。

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

## 11. Widget layout comparison previews

Weather widget layout changes require a comparison/debug HTML preview in `documents/` before applying the app change.
The preview should show the target 3:2 viewport and the expected quick-look or detail layout variants.
This before/after HTML preview practice extends to other widgets' quick-look/detail layout changes (not only Weather) whenever a change reshapes spacing or adds/removes content blocks, since it lets the user sign off on the visual direction before code changes land.

### Measure real dimensions before mocking flexible-space layouts

A static comparison HTML can be wrong even after the user approves it, if its assumed dimensions don't match the live app. This happened once: a Calendar quick-look mock assumed an 780px card height and used a 5-row month grid; the real card was only 456px tall (358px flex body), leaving about 115px for that grid row, which made the real implementation's grid cells collapse to ~10px and overlap illegibly. The mock still "looked right" in isolation because it was never checked against a measured value.

Rules:

- Before building a comparison HTML for a layout change, distinguish whether the change is (a) restyling content inside an already fixed-size box (e.g. swapping a color, capping an item count) or (b) adding/resizing content inside a `flex: 1` / CSS grid `fr` region where the available space depends on sibling elements.
- For (a), an approximate mock is fine; the exact pixel dimensions rarely change the outcome.
- For (b), measure the real widget card and its existing sibling elements in the running dev server first (e.g. `getBoundingClientRect()` via Playwright at the target kiosk viewport `1524 x 1016`), and hardcode those measured values into the mock's CSS instead of guessing a round number.
- After the user approves a comparison HTML for a case (b) change and the app change is implemented, always re-screenshot the real app at the target viewport to confirm the approved design actually fits, and adjust the implementation (not just the mock) if it doesn't.

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

## 13. Authenticated kiosk hosting candidate

Private Google Calendar、位置情報、家庭内 API など個人情報を含む data source を扱う場合、Cloudflare Pages / Workers / Access は候補にできる。
ただし、Fully Kiosk Browser の無人運用では browser cookie の長期維持を前提にしない。Cloudflare Access の browser session だけに依存する構成は、session expiration、IdP 再認証、Android WebView cookie 消失、Google login の WebView 制限で停止する可能性がある。

### Recommended access model

現時点の推奨候補は、外部利用者には Cloudflare Access login を要求し、家庭内 kiosk には自宅回線の source IP 条件で bypass する構成。

```text
Kiosk tablet on home Wi-Fi
  -> home router global IPv4
  -> Cloudflare Access Bypass policy
  -> Cloudflare Pages / Worker
  -> normalized WidgetData

External browser
  -> Cloudflare Access Allow policy
  -> Cloudflare Pages / Worker
  -> normalized WidgetData
```

Rules:

- Access policy の bypass 条件は原則として自宅グローバル IPv4 の `/32` を使う。
- Dynamic IPv4 の場合は Cloudflare Zero Trust IP list などを API で自動更新する。Cloudflare API token は家庭内 server、router、NAS など server-side boundary に置き、frontend、public JSON、`VITE_`、screenshot、logs には置かない。
- Bypass は identity check と Access request logging を回避するため、自宅グローバル IP 配下の端末が private dashboard に到達できる risk を accepted risk として扱う。
- Worker / Pages Function は secret を保持してよいが、response は WidgetData contract に正規化し、error は structured public-safe error にする。
- Private calendar は最初は busy block または `予定あり` 程度の minimized data を返す。Event title、location、calendar name は別 decision として扱う。
- `localStorage` cache は private WidgetData に使わない。必要な場合は no-store、短 TTL、memory-only など private 専用 policy を定義する。
- Cloudflare Access service token を Fully Kiosk、frontend code、public config、tablet-local file に保存する設計は原則採用しない。採用する場合は端末上の長寿命 secret として明示的な risk acceptance と documentation update が必要。

### Initial private calendar contract

Private Calendar の初期表示は busy block のみとする。予定の多い/少ないの集計表示、event title、location、calendarName は扱わない。

Rules:

- Worker response は [api-calendar-worker-contract.md](/c:/WORKSPACE/IncredibleSmartDisplay/documents/api-calendar-worker-contract.md) に従う。
- `title` は固定表示ラベル `予定あり` のみ。
- `location` と `calendarName` は response に含めない。
- Busy block も private data と扱い、`localStorage` cache に保存しない。
- Private fetch 失敗時は stale private data を表示しない。
- 通常 `dashboard.config.ts` は `localDate` のままにし、Cloudflare Access と home IP bypass が検証されるまで private provider を本番有効化しない。
- Kiosk readiness は [kiosk-private-access-checklist.md](/c:/WORKSPACE/IncredibleSmartDisplay/documents/kiosk-private-access-checklist.md) で確認する。

### IPv4 / IPv6 decision

Home IP bypass では IPv4 と IPv6 の違いを明示的に扱う。

- IPv4 は通常、自宅 router の global IPv4 1 個を `/32` として allowlist できる。
- IPv6 は端末ごとに global IPv6 address を持つことがあり、Cloudflare から見る source IP が端末ごとに異なる。
- IPv6 address は privacy extension などで変わることがあるため、tablet の単一 `/128` を長期 allowlist する方針は安定しない可能性が高い。
- IPv6 を許可する場合は自宅 LAN prefix の `/64` または ISP delegated prefix の `/56` などを allowlist する可能性があるが、その範囲内の複数端末を trust することになる。
- Kiosk 無人運用では、まず kiosk traffic を IPv4 に寄せ、自宅 IPv4 `/32` bypass で検証する。

### CGNAT precondition check

自宅 IPv4 `/32` allowlist は、その IPv4 が自宅回線専有であることが前提。CGNAT (Carrier-Grade NAT) 配下では同じ IPv4 を他契約者と共有するため、`/32` allowlist が意図しない他者を通す、または安定した単一 IPv4 自体を得られない可能性がある。Phase 4 (private calendar 有効化) に進む前に、必ず以下を確認する。

- Router 管理画面で WAN 側 IPv4 を確認し、`100.64.0.0/10` (RFC 6598 の CGNAT 予約レンジ) に該当しないか確認する。該当する場合は CGNAT 配下と判断する。
- 契約 ISP のプラン種別を確認する。IPoE 系 (v6プラス、transix、OCN バーチャルコネクトなど DS-Lite/MAP-E 方式) は IPv4 部分が CGNAT 共有である前提で扱う。PPPoE (IPv4 単独契約) は専有 IPv4 の可能性が高いが、契約内容で個別確認する。
- Cloudflare Access のアクセスログに記録される source IP と、Router 管理画面上の WAN IP が一致するか照合する。

Decision:

- CGNAT でないと確認できた場合のみ、`/32` allowlist による home IP bypass (Phase 4) に進んでよい。
- CGNAT 配下と判明した場合、IP allowlist にはよらず、kiosk tablet と home 側との間に WireGuard または Tailscale などのトンネルを構成し、端末単位の trust に切り替える方式を優先候補とする。IP ではなく端末証明書/鍵ベースの trust になるため CGNAT の影響を受けない。
- ISP の固定 IPv4 オプション契約への切り替えも代替候補として残すが、追加費用が発生するため優先度は下げる。

### Home IP transition window

自宅回線の WAN IPv4 は DHCP 更新やルーター再起動で変わることがある。IP 変更から server-side updater が Cloudflare allowlist を更新し終えるまでの間、次の 2 つの window が生じる。

- 新 IP がまだ allowlist に追加されていない window: kiosk が一時的に private data にアクセスできなくなる。可用性の問題に留まり、セキュリティ上のリスクではない。既存方針(private fetch 失敗時は stale private data を表示しない)と矛盾しないため、fail closed で構わない。
- 旧 IP がまだ allowlist に残っている window: 自宅が旧 IP を手放した後、その IP が別契約者に再割当てされた場合、その別契約者が一時的に private dashboard へ到達できてしまう可能性がある。これは可用性ではなくセキュリティ上の露出であり、優先して縮小すべき window。

Rules:

- Updater は新 IP の追加と旧 IP の削除を同一実行内で行い、「削除」を「追加」より低優先度にしない。
- Updater の実行間隔(検知から allowlist 反映までの許容時間)を明示的な数値で運用する。目安は 15 分以内。
- Updater が連続して失敗した場合に気づける手段(ログ確認や通知)を用意する。無人で数日気づかれない状態を避ける。
- この window は「home IP bypass 自体を accepted risk として扱う」という既存方針の一部として扱うが、境界時間を明示しないまま放置しない。

### Kiosk IPv4 operation options

方針 A: kiosk 用 hostname / Cloudflare-side control。

- Cloudflare 側で完結させたい場合に検討する。
- Cloudflare IPv6 Compatibility は zone-level setting として扱い、同一 zone 内の特定 hostname だけ IPv4-only にできる前提を置かない。
- 同一 zone 全体の IPv6 を off にするか、kiosk 用に別 domain / separate zone を用意して IPv6 off とする。
- Cloudflare Pages custom domain は Pages dashboard で関連付ける。DNS CNAME だけを直接追加する運用を前提にしない。
- 通常利用 hostname と kiosk hostname を分ける場合でも、private data response の最小化と Worker-side validation は維持する。

方針 B: kiosk 専用 SSID / router-side IPv4-only network。

- Router が SSID ごとの IPv6 disable、VLAN、guest network isolation を提供する場合の第一候補。
- `Home` SSID は IPv4 + IPv6 の通常運用を維持し、`Kiosk` SSID だけ IPv4-only にできる。
- 可能なら kiosk SSID は LAN client isolation を有効にし、internet egress のみ許可する。
- Cloudflare Access から見る source IPv4 は同じ自宅回線配下の端末で共有されるため、この方針だけでは kiosk tablet だけを厳密には識別しない。

Decision guide:

- Router が kiosk 専用 SSID で IPv4-only と client isolation を安定提供できるなら、方針 B を優先する。
- Router が対応しない、または家庭内 network を複雑にしたくない場合は、方針 A の separate domain / separate zone を検討する。
- 同一 zone の特定 subdomain だけ IPv4-only にできる前提で設計しない。
- どちらの方針でも、最終的な security boundary は `home global IPv4 is trusted` であり、kiosk tablet 個体の厳密認証ではない。
- 実装前に tablet 実機で `test-ipv6.com`、target hostname の DNS `A` / `AAAA`、Cloudflare Access logs の source IP を確認する。

## 14. Kiosk app-shell refresh

Fully Kiosk Browser は同一タブを常時表示し続けるため、GitHub Pages へ新しい build を deploy しても、起動中の SPA はメモリ上の旧 JS/HTML を使い続け、`dashboard.config.ts` や schemaVersion の変更が反映されない。

Rules:

- App 側にバージョン検知や自動更新の仕組み(version.json polling など)は実装しない。deploy 頻度が低い個人運用では過剰な複雑化になるため。
- 代わりに Fully Kiosk Browser のネイティブ機能 (Scheduled reload / restart) で、1 日 1 回のフルリロードを運用設定する。
- リロード時刻は視聴の妨げにならない深夜帯とし、日付跨ぎの再取得ロジック (23:59-00:00 の Calendar / Weather 再取得) を避けた時間、目安として `04:00 JST` を推奨する。
- 将来 deploy 頻度が上がり日次リロードでは更新反映が遅すぎると判断した場合のみ、軽量な version.json polling によるアプリ内リロード検知を追加検討する。それまでは実装しない。

Reload そのものがキャッシュ済みの古い資産を再表示するだけでは意味がないため、ブラウザ/CDN キャッシュ層も合わせて扱う。

- Fully Kiosk Browser の Scheduled reload は、通常のページ内 reload ではなく、ブラウザキャッシュを無視する hard reload (cache-clear を伴う reload、または reload 前に app cache / WebView cache をクリアする設定) を使う。
- GitHub Pages の配信は `index.html` を短い cache lifetime で返す前提を置かず、hard reload によって cache 有無に関わらず最新の `index.html` を確実に取得できる状態を維持する。
- Vite の hashed asset (`*.[hash].js` など) は長期 cache されてよい。`index.html` が新しい hash を指す限り、hard reload で自動的に新しい asset に切り替わる。
- Hard reload を運用しても、GitHub Pages 側 CDN のエッジキャッシュ TTL が残っている間は最新 build を取得できない可能性がある。deploy 直後すぐには反映されないことを許容し、日次リロードのタイミングで十分反映されていることを前提にする。

## 15. Documentation maintenance

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
