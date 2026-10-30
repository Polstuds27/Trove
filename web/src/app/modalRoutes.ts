import { useEffect, useRef } from "react";
import { useLocation, type Location } from "react-router-dom";
import { isAuthRoute } from "./navigation";

/** A directly opened editor still needs a real page beneath its sheet. */
export function editorBackgroundPath(pathname: string): string | null {
  const match = /^\/(accounts|transactions|categories|budgets|goals|debts|credit-cards|recurring|installments)\/(new|([^/]+)\/edit)$/.exec(pathname);
  if (!match) return null;
  const [, section, action, id] = match;
  return action === "new" || section === "categories" ? `/${section}` : `/${section}/${id}`;
}
/** Retain the exact page (including filters) until its editor is closed. */
export function useModalBackground(isAuthenticated: boolean) {
  const location = useLocation();
  const previousPage = useRef<Location | null>(null);
  const editorBackground = editorBackgroundPath(location.pathname);
  const backgroundLocation = editorBackground ? previousPage.current ?? editorBackground : location;
  useEffect(() => {
    if (!isAuthenticated) previousPage.current = null;
    else if (!editorBackground && !isAuthRoute(location.pathname)) previousPage.current = location;
  }, [location, editorBackground, isAuthenticated]);
  return { backgroundLocation, editorOpen: editorBackground !== null };
}
