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
import Groups from "./pages/Groups";
import ScheduleWorkout from "./pages/ScheduleWorkout";
import GroupWorkouts from "./pages/GroupWorkouts";

const App: React.FC = () => {
  // Em desenvolvimento, podemos considerar o usuário sempre autenticado
  const isAuthenticated = process.env.NODE_ENV === 'development' ? true : false;
  const [location] = useLocation();

  // Verificar se estamos em páginas relacionadas a grupos
  const isGroupsPage = location === "/groups" || 
                      location === "/groups/coach" || 
                      location.startsWith("/group-workouts/") || 
                      location.startsWith("/schedule-workout/");

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
            <TabNavigation />
          </AuthGuard>
        </Route>
        
        <Route path="/settings">
          <AuthGuard>
            <Settings />
            <TabNavigation />
          </AuthGuard>
        </Route>
        
        {/* Rotas para grupos de treinamento */}
        <Route path="/groups">
          <AuthGuard>
            <TabProvider>
              <Groups />
              <TabNavigation />
            </TabProvider>
          </AuthGuard>
        </Route>
        
        <Route path="/groups/coach">
          <AuthGuard>
            <TabProvider>
              <Groups />
              <TabNavigation />
            </TabProvider>
          </AuthGuard>
        </Route>
        
        <Route path="/schedule-workout/:groupId">
          <AuthGuard>
            <TabProvider>
              <ScheduleWorkout />
              <TabNavigation />
            </TabProvider>
          </AuthGuard>
        </Route>
        
        <Route path="/group-workouts/:groupId">
          <AuthGuard>
            <TabProvider>
              <GroupWorkouts />
              <TabNavigation />
            </TabProvider>
          </AuthGuard>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      
      <Toaster />
    </div>
  );
};

export default App;
