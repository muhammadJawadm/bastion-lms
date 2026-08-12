/**
 * LMSInfo — /lms-platform
 * Redirects to the full LMS marketing page at /lms/about.
 * Kept so any existing links to /lms-platform still work.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LMSInfo() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/lms/about");
  }, [navigate]);
  return null;
}
