import { createFileRoute } from "@tanstack/react-router";
import { NoraApp } from "@/components/nora/NoraApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <NoraApp />;
}
