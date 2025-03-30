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
            img: item.getElementsByTagName("enclosure")[0]?.getAttribute("url"),
            source:
              item.getElementsByTagName("source")[0]?.textContent || "Unknown",
          })
        );

        // Merge new items with existing ones, avoiding duplicates
        setFeedItems((prevItems) => {
          const newItems = items.filter(
            (item) => !prevItems.some((prev) => prev.link === item.link)
          );
          return [...prevItems, ...newItems].sort(
            (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
          ); // Sort by time
        });

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch news feed");
        setLoading(false);
      }
    };

    fetchNews(); // Initial fetch

    // Fetch every 5 minutes (300,000 ms)
    const intervalId = setInterval(fetchNews, 300000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array since fetchNews is inside

  const sources = [
    "All",
    "Punch",
    "Vanguard",
    "The Nation",
    "Guardian",
    "This Day",
    "Premium Times",
    "Channel TV",
    "Sahara Reporters",
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
    <div className="flex flex-col bg-purple-200 min-h-screen">
      <div className="flex p-2 items-center justify-between mt-3">
        <div>
          <p className="font-inter font-bold border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur- text-md text-center text-black py-1 px-2 rounded-md">
            News Feed
          </p>
        </div>

        {/* select */}
        <div className="text-sm  border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur- text-black rounded-md">
          <label htmlFor="source-filter" className="text-black"></label>
          <select
            id="source-filter"
            className="font-inter"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-4 mt-4 pb-8">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <article
              key={index}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-md bg-white"
            >
              {item.img ? (
                <div className="w-full sm:w-[250px] h-[200px] sm:h-[100px]">
                  <img
                    src={item.img}
                    alt="Item image"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-[250px] h-[200px] sm:h-[100px] rounded-md bg-purple-300 flex items-center justify-center text-white">
                  {item.source}
                </div>
              )}
              <div className="flex flex-col justify-between flex-grow ">
                <div className="leading-5">
                  <h2 className="text-[17px] lg:text-md font-bold mb-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tracking-tight font-inter "
                    >
                      {item.title}
                    </a>
                  </h2>
                  <p className="text-sm mb-2 leading-4">
                    {item.description.substring(0, 150)}...
                  </p>
                </div>
                <div
                  className="text-xs px-2 py-1 rounded-md inline-block self-start"
                  style={{
                    backgroundColor:
                      sourceColors[item.source] || sourceColors["Unknown"],
                  }}
                >
                  {new Date(item.pubDate).toLocaleDateString()} - {item.source}
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="text-center p-4 bg-white rounded-md">
            No news available for this source.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
