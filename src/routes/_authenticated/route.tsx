import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSessionFn } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSessionFn();
    if (!user) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
