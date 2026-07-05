import { MaterialSymbolIcon } from "../../components/MaterialSymbolIcon";
import { StaleBadge } from "../../components/StaleBadge";
import { WidgetFrame } from "../../components/WidgetFrame";
import { formatDistanceToNowLabel, formatHourMinuteLabel as formatTime } from "../../utils/date";
import type { WidgetProps } from "../../types/widget";
import type { NewsData, NewsSettings } from "./types";

export function NewsWidget({ config, data, error, isEmpty, isHighlighted, status }: WidgetProps<NewsSettings, NewsData>) {
  return (
    <WidgetFrame
      cardClassName={`flex flex-col ${isHighlighted ? "ring-2 ring-cyan-400/60" : ""}`}
      error={error}
      hasData={data !== undefined}
      headerExtra={
        <div className="text-right text-xs font-semibold text-slate-500">
          {status === "stale" ? <StaleBadge /> : null}
          {data?.generatedAt ? <p className="mt-1">更新 {formatTime(data.generatedAt)}</p> : null}
        </div>
      }
      icon={<MaterialSymbolIcon name="newspaper" />}
      isEmpty={isEmpty}
      status={status}
      title={config.title}
    >
      {data ? (isHighlighted ? <NewsDetail data={data} maxItems={config.settings?.maxItems ?? 5} /> : <NewsQuickLook data={data} maxItems={config.settings?.maxItems ?? 5} />) : null}
    </WidgetFrame>
  );
}

const NEWS_QUICKLOOK_ITEM_COUNT = 1;

function NewsQuickLook({ data, maxItems }: { data: NewsData; maxItems: number }) {
  const visibleCount = Math.min(maxItems, NEWS_QUICKLOOK_ITEM_COUNT);
  const items = data.items.slice(0, visibleCount);
  const remaining = Math.min(data.items.length, maxItems) - items.length;

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2">
      <ul className="grid min-h-0 content-start gap-3 overflow-hidden">
        {items.map((item) => (
          <li key={item.id} className="widget-list-item rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="line-clamp-2 text-[25px] font-semibold leading-tight text-white">{item.title}</p>
            <NewsMetaLine publishedAt={item.publishedAt} source={item.source} />
          </li>
        ))}
      </ul>
      {remaining > 0 ? <p className="text-center text-sm font-bold text-blue-600">{`タップして残り${remaining}件を見る →`}</p> : null}
    </div>
  );
}

function NewsDetail({ data, maxItems }: { data: NewsData; maxItems: number }) {
  const items = data.items.slice(0, Math.max(maxItems, 1));
  const [topItem, ...remainingItems] = items;

  if (!topItem) {
    return null;
  }

  return (
    <div className="widget-detail-root news-detail-root mt-4 grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
      <div className="col-span-2 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">主要ニュース</p>
          <h2 className="mt-1 text-3xl font-semibold leading-tight text-slate-950">ニュース クイックルック</h2>
        </div>
        <p className="shrink-0 text-sm font-semibold text-slate-500">{items.length}件</p>
      </div>

      <section className="widget-detail-primary news-detail-featured grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <NewsCategoryLabel category={topItem.category ?? "主要"} />
          <NewsMetaLine publishedAt={topItem.publishedAt} source={topItem.source} />
        </div>
        <div className="mt-5 min-h-0">
          <h3 className="line-clamp-3 text-4xl font-semibold leading-tight text-slate-950">{topItem.title}</h3>
          {topItem.summary ? <p className="mt-4 line-clamp-4 text-xl font-medium leading-relaxed text-slate-600">{topItem.summary}</p> : null}
        </div>
        <p className="mt-5 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-500">
          表示順はニュースサービス層で整理しています。
        </p>
      </section>

      <section className="widget-detail-list news-detail-list min-h-0 overflow-hidden">
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <h3 className="pb-2 text-lg font-semibold text-slate-700">最新ヘッドライン</h3>
          <ul className="grid min-h-0 gap-3 overflow-hidden">
            {remainingItems.map((item) => (
              <li key={item.id} className="widget-list-item grid min-h-[5.8rem] grid-rows-[auto_minmax(0,1fr)_auto] rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <NewsCategoryLabel category={item.category ?? "ニュース"} />
                  <NewsMetaLine publishedAt={item.publishedAt} source={item.source} />
                </div>
                <p className="mt-2 line-clamp-2 text-xl font-semibold leading-snug text-white">{item.title}</p>
                {item.summary ? <p className="mt-1 truncate text-sm font-medium text-slate-500">{item.summary}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function NewsCategoryLabel({ category }: { category: string }) {
  return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-amber-700">{category}</span>;
}

function NewsMetaLine({ publishedAt, source }: { publishedAt?: string; source?: string }) {
  const parts = [source, publishedAt ? formatDistanceToNowLabel(publishedAt) : null].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return <p className="mt-2 text-base font-semibold text-slate-400">{parts.join(" / ")}</p>;
}
