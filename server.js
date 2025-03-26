import express from "express";
import cors from "cors";
import RSSParser from "rss-parser";
import fetch from "node-fetch";

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const app = express();
const parser = new RSSParser();
const port = process.env.PORT || 3000;

app.use(cors());

const newsFeeds = [
  { url: "https://punchng.com/feed/", name: "Punch" },
  { url: "https://www.vanguardngr.com/feed/", name: "Vanguard" },
  { url: "https://thenationonlineng.net/feed/", name: "The Nation" },
  { url: "https://guardian.ng/feed/", name: "Guardian" },
  { url: "https://www.thisdaylive.com/feed/", name: "This Day" },
];

app.get("/api/feed", async (req, res) => {
  try {
    let rssItems = [];

    const feedPromises = newsFeeds.map(async ({ url, name }) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items.map((item) => ({ ...item, source: name }));
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    rssItems = results.flat();

    rssItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Nigeria News Aggregator</title>
        <description>Latest news from Nigerian sources</description>
vak        <link>https://your-vercel-domain.vercel.app</link>
        ${rssItems
          .map(
            (item) => `
        <item>
            <title><![CDATA[${escapeXml(item.title)}]]></title>
            <link>${escapeXml(item.link)}</link>
            <description><![CDATA[${escapeXml(
              item.contentSnippet || item.description || ""
            )}]]></description>
            <pubDate>${escapeXml(
              item.pubDate || new Date().toUTCString()
            )}</pubDate>
            <source>${escapeXml(item.source)}</source>
        </item>`
          )
          .join("")}
    </channel>
</rss>`;

    res.set("Content-Type", "application/rss+xml");
    res.send(rssFeed);
  } catch (error) {
    console.error("Error generating feed:", error);
    res.status(500).send("Error generating feed");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
