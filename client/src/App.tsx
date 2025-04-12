import React from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TabProvider } from "./context/TabContext";

// Components
import Header from "./components/Header";
import TabNavigation from "./components/TabNavigation";
import MainContent from "./components/MainContent";
import AuthGuard from "./components/AuthGuard";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/not-found";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import WodGeneratorDemo from "./pages/WodGeneratorDemo";

// import { useAuth } from "./context/AuthContext";

const App: React.FC = () => {
  // Mock auth state for testing
  const isAuthenticated = true;
  const isLoading = false;
  const [location] = useLocation();

  // Show loader while checking authentication status
  if (isLoading) {
    return (
      <div className="app-container min-h-screen flex flex-col">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen flex flex-col">
      {(isAuthenticated || location === "/login" || location === "/register" || location === "/wod-demo") && <Header />}
      
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/wod-demo" component={WodGeneratorDemo} />
        
        <Route path="/">
          <AuthGuard>
            <TabProvider>
              <MainContent />
              <TabNavigation />
            </TabProvider>
          </AuthGuard>
        </Route>
        
        <Route path="/profile">
          <AuthGuard>
            <Profile />
          </AuthGuard>
        </Route>
        
        <Route path="/settings">
          <AuthGuard>
            <Settings />
          </AuthGuard>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      
      <Toaster />
    </div>
  );
};

export default App;
