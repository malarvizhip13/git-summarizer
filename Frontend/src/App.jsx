import { useEffect, useState } from "react";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/v1/health"
        );

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        setApiStatus(data.message);
      } catch (error) {
        setApiStatus("Backend API is unavailable");
      }
    };

    checkApi();
  }, []);

  return (
    <div>
      <h1>GitSummarizer</h1>

      <p>
        Understand GitHub repositories with AI.
      </p>

      <p>
        API Status: {apiStatus}
      </p>
    </div>
  );
}

export default App;