import { Outlet, createRootRoute } from "@tanstack/react-router";
import HeaderBrand from "@/components/HeaderBrand";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-bg">
        <div className="mx-auto flex h-14 max-w-[480px] items-center px-4">
          <HeaderBrand />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
