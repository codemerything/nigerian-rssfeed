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

// Helper function to extract image URL from HTML content
function extractImageUrl(htmlContent) {
  if (!htmlContent) return "";
  const match = htmlContent.match(/<img[^>]+src=["'](.*?)["']/i);
  return match ? match[1] : "";
}

const app = express();
const parser = new RSSParser();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "https://nigerian-rssfeed.vercel.app",
  })
);

const newsFeeds = [
  { url: "https://punchng.com/feed/", name: "Punch" },
  { url: "https://www.vanguardngr.com/feed/", name: "Vanguard" },
  { url: "https://thenationonlineng.net/feed/", name: "The Nation" },
  { url: "https://guardian.ng/feed/", name: "Guardian" },
  { url: "https://www.premiumtimesng.com/feed/", name: "Premium Times" },
  {
    url: "https://saharareporters.com/articles/rss-feed",
    name: "Sahara Reporters",
  },
  { url: "https://www.channelstv.com/feed/", name: "Channel TV" },
];

app.get("/api/feed", async (req, res) => {
  try {
    let rssItems = [];

    const feedPromises = newsFeeds.map(async ({ url, name }) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items.map((item) => {
          // Use enclosure if available, otherwise extract from content:encoded
          let imageUrl =
            item.enclosure?.url ||
            extractImageUrl(
              item["content:encoded"] || item.content || item.description || ""
            );
          return {
            ...item,
            source: name,
            enclosure: {
              url: imageUrl,
              length: item.enclosure?.length || "0", // Default length if not provided
              type: item.enclosure?.type || (imageUrl ? "image/jpeg" : ""), // Guess type if needed
            },
          };
        });
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
        <link>https://your-vercel-domain.vercel.app</link>
        ${rssItems
          .map((item) => {
            const enclosure = item.enclosure || {};
            const imageUrl = enclosure.url || "";
            const imageLength = enclosure.length || "0";
            const imageType = enclosure.type || "";
            return `
        <item>
            <title><![CDATA[${escapeXml(item.title)}]]></title>
            <link>${escapeXml(item.link)}</link>
            <description><![CDATA[${escapeXml(
              item.contentSnippet || item.description || ""
            )}]]></description>
            <pubDate>${escapeXml(
              item.pubDate || new Date().toUTCString()
            )}</pubDate>
            ${
              imageUrl
                ? `<enclosure url="${escapeXml(imageUrl)}" length="${escapeXml(imageLength)}" type="${escapeXml(imageType)}" />`
                : ""
            }
            <source>${escapeXml(item.source)}</source>
        </item>`;
          })
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

app.get("/api/singlefeed", async (req, res) => {
  try {
    const feed = await parser.parseURL("https://www.premiumtimesng.com/feed");

    res.json(feed);
  } catch (error) {
    console.error("Error generating feed:", error);

    res.status(500).send("Error generating feed");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
