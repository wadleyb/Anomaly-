import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import Result from "@/pages/Result";
import Archive from "@/pages/Archive";
import Journey from "@/pages/Journey";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/play" component={Game} />
      <Route path="/result" component={Result} />
      <Route path="/archive" component={Archive} />
      <Route path="/journey" component={Journey} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
