// SEC's company list only has English legal names ("Alibaba Group Holding Ltd"),
// so a Chinese-language query like "阿里巴巴" or "拼多多" will never match it by
// title search. This is a small, manually maintained alias table covering the
// US-listed companies (Chinese ADRs plus a handful of globally relevant names)
// that a cross-border research team is most likely to type in Chinese.
//
// This is intentionally a flat list, not an exhaustive database — extend it as
// gaps are found rather than trying to solve general Chinese/English company
// name matching.

const ALIASES = [
  { ticker: "BABA", names: ["阿里巴巴", "阿里", "alibaba"] },
  { ticker: "PDD", names: ["拼多多", "pinduoduo", "temu"] },
  { ticker: "JD", names: ["京东", "jd.com"] },
  { ticker: "BIDU", names: ["百度", "baidu"] },
  { ticker: "NTES", names: ["网易", "netease"] },
  { ticker: "TME", names: ["腾讯音乐", "tencent music"] },
  { ticker: "BILI", names: ["哔哩哔哩", "b站", "bilibili"] },
  { ticker: "NIO", names: ["蔚来", "nio"] },
  { ticker: "LI", names: ["理想汽车", "理想", "li auto"] },
  { ticker: "XPEV", names: ["小鹏汽车", "小鹏", "xpeng"] },
  { ticker: "TCOM", names: ["携程", "trip.com", "ctrip"] },
  { ticker: "YUMC", names: ["百胜中国", "yum china"] },
  { ticker: "ZTO", names: ["中通快递", "zto express"] },
  { ticker: "VIPS", names: ["唯品会", "vipshop"] },
  { ticker: "TAL", names: ["好未来", "tal education"] },
  { ticker: "EDU", names: ["新东方", "new oriental"] },
  { ticker: "IQ", names: ["爱奇艺", "iqiyi"] },
  { ticker: "WB", names: ["微博", "weibo"] },
  { ticker: "ATHM", names: ["汽车之家", "autohome"] },
  { ticker: "HTHT", names: ["华住", "huazhu"] },
  { ticker: "FUTU", names: ["富途", "富途控股", "futu"] },
  { ticker: "TIGR", names: ["老虎证券", "up fintech", "tiger brokers"] },
  { ticker: "MNSO", names: ["名创优品", "miniso"] },
  { ticker: "LU", names: ["陆金所", "lufax"] },
  { ticker: "QFIN", names: ["奇富科技", "360数科", "qifu"] },
  { ticker: "DOYU", names: ["斗鱼", "douyu"] },
  { ticker: "GOTU", names: ["高途", "gaotu"] },
  { ticker: "BEKE", names: ["贝壳", "beike", "ke holdings"] },
  { ticker: "LANV", names: ["朗万", "浪凡", "lanvin", "lanvin group"] },
  { ticker: "AAPL", names: ["苹果", "apple"] },
  { ticker: "MSFT", names: ["微软", "microsoft"] },
  { ticker: "GOOGL", names: ["谷歌", "google", "alphabet"] },
  { ticker: "AMZN", names: ["亚马逊", "amazon"] },
  { ticker: "META", names: ["meta", "facebook", "脸书"] },
  { ticker: "TSLA", names: ["特斯拉", "tesla"] },
  { ticker: "NVDA", names: ["英伟达", "nvidia"] },
  { ticker: "TSM", names: ["台积电", "tsmc"] },
  { ticker: "NKE", names: ["耐克", "nike"] },
  { ticker: "SBUX", names: ["星巴克", "starbucks"] },
  { ticker: "DIS", names: ["迪士尼", "disney"] },
  { ticker: "KO", names: ["可口可乐", "coca-cola", "coca cola"] },
  { ticker: "MCD", names: ["麦当劳", "mcdonald's", "mcdonalds"] },
];

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function resolveAlias(query) {
  const q = normalize(query);
  if (!q) return null;
  for (const entry of ALIASES) {
    if (entry.names.some((name) => normalize(name) === q)) {
      return entry.ticker;
    }
  }
  // Loose contains-match fallback for longer natural queries.
  for (const entry of ALIASES) {
    if (entry.names.some((name) => q.includes(normalize(name)))) {
      return entry.ticker;
    }
  }
  return null;
}

module.exports = { resolveAlias };
