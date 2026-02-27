import { createBrowserRouter } from "react-router";
import Booking from "./pages/Booking";
import Admin from "./pages/Admin";

function getBasename() {
  const p = window.location.pathname;

  // /en/booking/...  (also supports fa, tr, ar, etc. or 2-letter locales)
  const m = p.match(/^\/([a-z]{2})\/booking(\/|$)/i);
  if (m) return `/${m[1]}/booking`;

  // /booking/...
  if (p.startsWith("/booking")) return "/booking";

  return "/";
}

// use a basename so the router knows it's mounted under /booking
export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Booking,
    },
    {
      path: "/admin",
      Component: Admin,
    },
  ],
  { basename:  getBasename() }
);
