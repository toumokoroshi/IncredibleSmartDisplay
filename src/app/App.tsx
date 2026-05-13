import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { dashboardConfig } from "../config/dashboard.config";
import { DashboardProvider } from "../contexts/DashboardContext";
import { DashboardShell } from "../layouts/DashboardShell";

const queryClient = new QueryClient();

export default function App() {
  const [displayMode, setDisplayMode] = useState(dashboardConfig.app.defaultDisplayMode);

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider value={{ displayMode, setDisplayMode }}>
        <DashboardShell />
      </DashboardProvider>
    </QueryClientProvider>
  );
}
