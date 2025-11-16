import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main application layout component
 *
 * Provides consistent styling across all pages:
 * - Full-height viewport
 * - Gradient background
 * - Consistent padding
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {children}
    </div>
  );
}

