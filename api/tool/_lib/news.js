// News source (all markets): Google News RSS. Free, no API key, and unlike
// GDELT (used in the earlier prototype) it returns results that are actually
// relevant to the query, with real publisher attribution per item.
//
// Known limitation: Google News RSS links are redirect URLs
// (news.google.com/rss/articles/...), not the publisher's direct URL. They
// still resolve to the real article when opened, which is what "查看原文"
// needs — we just can't display the bare origin domain without following the
// redirect server-side, so we rely on the <source> tag for publisher name.

const { fetchText, decodeEntities } = require("./util");

const AUTHORITATIVE_PUBLISHERS = [
  "reuters", "路透", "bloomberg", "彭博", "financial times", "wsj", "the wall street journal",
  "caixin", "财新", "证券时报", "上海证券报", "中国证券报", "21世纪经济报道", "第一财经",
  "sec.gov", "hkex", "cninfo", "新华社", "人民日报", "央视",
];

function isAuthoritative(publisherName, link) {
  const haystack = `${publisherName || ""} ${link || ""}`.toLowerCase();
  return AUTHORITATIVE_PUBLISHERS.some((name) => haystack.includes(name));
}

function parseRss(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    const title = decodeEntities((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const link = decodeEntities((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    const sourceMatch = block.match(/<source url="([^"]*)">([\s\S]*?)<\/source>/);
    const publisherUrl = sourceMatch ? sourceMatch[1] : null;
    const publisherName = sourceMatch ? decodeEntities(sourceMatch[2]) : null;
    if (!title || !link) continue;
    const cleanTitle = publisherName && title.endsWith(` - ${publisherName}`)
      ? title.slice(0, -(publisherName.length + 3))
      : title;
    items.push({
      title: cleanTitle,
      link,
      publisherName: publisherName || "未知来源",
      publisherUrl,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
    });
  }
  return items;
}

// query: search text. locale: { hl, gl, ceid } e.g. zh-CN/CN/CN:zh-Hans or en-US/US/US:en
async function fetchNews(query, locale, limit = 15) {
  const params = new URLSearchParams({
    q: `${query} when:30d`,
    hl: locale.hl,
    gl: locale.gl,
    ceid: locale.ceid,
  });
  try {
    const xml = await fetchText(`https://news.google.com/rss/search?${params.toString()}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    }, 9000);
    return parseRss(xml).slice(0, limit);
  } catch (error) {
    return [];
  }
}

function buildNewsEvents(items, company, market) {
  return items.map((item, index) => {
    const sourceId = `news-${market}-${company.id}-${index}`;
    const authoritative = isAuthoritative(item.publisherName, item.link);
    return {
      id: sourceId,
      market,
      eventType: "news", // refined further by scoring.js keyword rules (regulatory / industry)
      company: company.name,
      ticker: company.id,
      formType: null,
      timestamp: item.publishedAt,
      title: item.title,
      summary: item.title,
      importance: authoritative ? "medium" : "low",
      sourceIds: [sourceId],
      sources: [
        {
          id: sourceId,
          sourceType: "news",
          credibility: authoritative ? "authoritative-media" : "general-media",
          publisher: item.publisherName,
          title: item.title,
          publishedAt: item.publishedAt,
          url: item.link,
        },
      ],
    };
  });
}

module.exports = { fetchNews, buildNewsEvents };
