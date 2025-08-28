import * as React from "react";

import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Zap,
  Sun,
  Shield,
  Settings,
  Bolt,
  Bell,
  User as UserIcon
} from "lucide-react";

import AIAssistantButton from "@/components/ai/AIAssistantButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import solarcore from '../assets/SolarCore-1.svg';


const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Dashboard"),
    icon: Home,
    color: "text-yellow-600"
  },
  {
    title: "Automation",
    url: createPageUrl("Automation"),
    icon: Zap,
    color: "text-blue-600"
  },
  {
    title: "Energy",
    url: createPageUrl("Energy"),
    icon: Bolt,
    color: "text-green-600"
  },
  {
    title: "Safety",
    url: createPageUrl("Safety"),
    icon: Shield,
    color: "text-red-600"
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
    color: "text-gray-600"
  }
];

const SideNav = () => {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <img src={solarcore} alt="SolarCore Logo" className="h-10 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-inter">SolarCore</h1>
          <p className="text-xs text-gray-500 font-inter">Smart Home Control</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : item.color}`} />
              <span className="font-inter">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="grid grid-cols-5 px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center justify-center gap-1 p-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : item.color}`} />
              <span className={`text-[10px] font-medium font-inter text-center ${isActive ? 'text-primary' : ''}`}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const TopBar = () => {
  return (
    <header className="lg:hidden bg-white shadow-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={solarcore} alt="SolarCore Logo" className="h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-inter">SolarCore</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Notifications")}>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-gray-600"/>
            </Button>
          </Link>
          <Link to={createPageUrl("Settings")}>
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5 text-gray-600"/>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

const DesktopHeader = () => {
  return (
    <header className="hidden lg:flex bg-white shadow-sm border-b border-gray-100 px-6 py-3 items-center justify-end">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Notifications")}>
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5 text-gray-600"/>
          </Button>
        </Link>
        <Link to={createPageUrl("Settings")}>
          <Button variant="ghost" size="icon">
            <UserIcon className="w-5 h-5 text-gray-600"/>
          </Button>
        </Link>
      </div>
    </header>
  );
};

interface LayoutProps {
  children?: React.ReactNode;
  currentPageName?: string;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-solarcore-gray flex flex-col lg:flex-row">
      <ScrollToTop />
      <SideNav />
      <TopBar />

      <div className="flex-1 lg:pl-64">
        <DesktopHeader />
        <main className="flex-1 overflow-auto pb-24 lg:pb-6">
          {children || <Outlet />}
        </main>
      </div>

      {/* <AIAssistantButton /> */}
      <BottomNav />
    </div>
  );
}