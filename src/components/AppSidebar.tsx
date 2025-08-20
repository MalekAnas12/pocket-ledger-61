import { useState } from "react";
import { 
  BarChart3, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Target,
  Settings,
  FileText,
  Download,
  Upload,
  Calculator,
  Calendar,
  Bell
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", value: "overview", icon: BarChart3 },
  { title: "Transactions", value: "transactions", icon: Wallet },
  { title: "Accounts", value: "accounts", icon: CreditCard },
  { title: "Analytics", value: "analytics", icon: PieChart },
  { title: "Tools", value: "tools", icon: Plus },
];

const quickActions = [
  { title: "Add Transaction", action: "add-transaction", icon: Plus },
  { title: "Add Account", action: "add-account", icon: CreditCard },
  { title: "Import Data", action: "import", icon: Upload },
  { title: "Export Data", action: "export", icon: Download },
];

const insights = [
  { title: "Income Trend", value: "+12%", icon: TrendingUp, color: "text-success" },
  { title: "Expense Trend", value: "-5%", icon: TrendingDown, color: "text-destructive" },
  { title: "Savings Goal", value: "68%", icon: Target, color: "text-primary" },
];

export function AppSidebar({ onTabChange, activeTab, onActionClick }: { 
  onTabChange: (tab: string) => void;
  activeTab: string;
  onActionClick: (action: string) => void;
}) {
  const { state } = useSidebar();

  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.value)}
                    className={getNavCls(activeTab === item.value)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((action) => (
                  <SidebarMenuItem key={action.action}>
                    <SidebarMenuButton 
                      onClick={() => onActionClick(action.action)}
                      className="hover:bg-muted/50"
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      <span>{action.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Insights */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Insights</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                {insights.map((insight) => (
                  <div key={insight.title} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <insight.icon className={`h-4 w-4 ${insight.color}`} />
                      <span className="text-sm">{insight.title}</span>
                    </div>
                    <span className={`text-sm font-medium ${insight.color}`}>
                      {insight.value}
                    </span>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}