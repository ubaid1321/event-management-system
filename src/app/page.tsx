import { redirect } from "next/navigation";

export default function RootPage() {
  // The proxy has already established there is a session by the time this runs.
  redirect("/overview");
}
