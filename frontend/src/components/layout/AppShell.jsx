import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Outlet } from 'react-router-dom';
import { CopilotPanel } from '@/components/shared/CopilotPanel';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { FLAGS } from '@/lib/featureFlags';

/**
 * Global application wrapper for authenticated paths.
 * Organizes Sidebar, TopBar, and the inner routing viewport (Outlet).
 */
export function AppShell() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Permanent Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Header */}
        <TopBar onToggleCopilot={() => setIsCopilotOpen(true)} />

        {/* Inner Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-8">
          <Outlet />
        </main>
      </div>

      {/* Recruiter AI Assistant drawer */}
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Global Command Palette — Ctrl+K */}
      {FLAGS.COMMAND_PALETTE_ENABLED && <CommandPalette />}
    </div>
  );
}
export default AppShell;
