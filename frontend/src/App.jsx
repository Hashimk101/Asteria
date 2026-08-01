import { useState }        from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage    from "./pages/LandingPage";
import VisualizerPage from "./pages/VisualizerPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 3 } },
});

export default function App() {
  const [screen, setScreen] = useState("landing"); // "landing" | "visualizer"

  return (
    <QueryClientProvider client={queryClient}>
      {screen === "landing"
        ? <LandingPage    onLaunch={() => setScreen("visualizer")} />
        : <VisualizerPage onBack={()   => setScreen("landing")}    />
      }
    </QueryClientProvider>
  );
}
