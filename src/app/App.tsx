import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { dashboardConfig } from "../config/dashboard.config";
import { DashboardProvider } from "../contexts/DashboardContext";
import { DashboardShell } from "../layouts/DashboardShell";
import { getUiThemeFromLocation } from "../utils/uiTheme";

const queryClient = new QueryClient();

export default function App() {
  const [displayMode, setDisplayMode] = useState(dashboardConfig.app.defaultDisplayMode);

  useEffect(() => {
    const theme = getUiThemeFromLocation(window.location.search);
    document.documentElement.dataset.uiTheme = theme;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider value={{ displayMode, setDisplayMode }}>
        <DashboardShell />
      </DashboardProvider>
    </QueryClientProvider>
  );
}
