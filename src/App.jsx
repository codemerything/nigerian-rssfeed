import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState("All");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "/api/feed";
        const response = await axios.get(`${apiUrl}`, {
          timeout: 8000,
        });
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const items = Array.from(xmlDoc.getElementsByTagName("item")).map(
          (item) => ({
            title: item.getElementsByTagName("title")[0].textContent,
            link: item.getElementsByTagName("link")[0].textContent,
            description:
              item.getElementsByTagName("description")[0]?.textContent || "",
            pubDate: item.getElementsByTagName("pubDate")[0]?.textContent,
            source:
              item.getElementsByTagName("source")[0]?.textContent || "Unknown",
          })
        );
        setFeedItems(items);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch news feed");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const sources = [
    "All",
    "Punch",
    "Vanguard",
    "The Nation",
    "Guardian",
    "This Day",
  ];
  const filteredItems =
    selectedSource === "All"
      ? feedItems
      : feedItems.filter((item) => item.source === selectedSource);

  // Map sources to colors
  const sourceColors = {
    Punch: "#ffe6e6", // Light red
    Vanguard: "#e6ffe6", // Light green
    "The Nation": "#e6f2ff", // Light blue
    Guardian: "#fff3e6", // Light orange
    "This Day": "#f2e6ff", // Light purple
    Unknown: "#f5f5f5", // Default grey
  };

  if (loading) return <div className="loading">Loading news...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      <h1>Uncos Naija News Feed</h1>
      <div className="filter-container">
        <label htmlFor="source-filter">Filter by source: </label>
        <select
          id="source-filter"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>
      <div className="feed-container">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <article
              key={index}
              className="news-item"
              style={{
                backgroundColor:
                  sourceColors[item.source] || sourceColors["Unknown"],
              }}
            >
              <h2>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h2>
              <p>{item.description.substring(0, 200)}...</p>
              <small>
                {new Date(item.pubDate).toLocaleDateString()} - {item.source}
              </small>
            </article>
          ))
        ) : (
          <p>No news available for this source.</p>
        )}
      </div>
    </div>
  );
}

export default App;
