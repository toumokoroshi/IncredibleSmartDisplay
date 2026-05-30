import { describe, expect, it } from "vitest";

import { buildNewsData, parseFeedItems } from "./generate-news-json.mjs";

const feed = {
  id: "fixture",
  name: "Fixture News",
  category: "System",
  url: "https://example.test/rss.xml",
};

describe("generate-news-json", () => {
  it("normalizes RSS fixture items without live network access", () => {
    const items = parseFeedItems(
      `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[ Second &amp; newer ]]></title>
          <link>https://example.test/second</link>
          <description><![CDATA[<p>Newer summary</p>]]></description>
          <category>Ops</category>
          <pubDate>Sat, 30 May 2026 12:00:00 GMT</pubDate>
        </item>
        <item>
          <title>First</title>
          <link>https://example.test/first</link>
          <description>Older summary</description>
          <pubDate>Sat, 30 May 2026 10:00:00 GMT</pubDate>
        </item>
      </channel></rss>`,
      feed,
    );

    const data = buildNewsData(items, 5, new Date("2026-05-30T12:30:00Z"));

    expect(data.generatedAt).toBe("2026-05-30T12:30:00.000Z");
    expect(data.items.map((item) => item.title)).toEqual(["Second & newer", "First"]);
    expect(data.items.map((item) => item.priority)).toEqual(["top", "normal"]);
    expect(data.items[0]).toMatchObject({
      category: "Ops",
      source: "Fixture News",
      summary: "Newer summary",
    });
  });

  it("normalizes Atom fixture links and falls back to feed category", () => {
    const items = parseFeedItems(
      `<?xml version="1.0"?>
      <feed>
        <entry>
          <title>Atom story</title>
          <link href="https://example.test/atom" />
          <summary>Atom summary</summary>
          <updated>2026-05-30T08:00:00Z</updated>
        </entry>
      </feed>`,
      feed,
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      category: "System",
      publishedAt: "2026-05-30T08:00:00.000Z",
      title: "Atom story",
    });
  });
});
