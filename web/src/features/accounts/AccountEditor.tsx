/**
 * Routed account editor.
 *
 * One component serves four URLs — `/accounts/new`, `/accounts/:accountId/edit`,
 * `/credit-cards/new` and `/credit-cards/:cardId/edit` — so the overlay is always
 * addressable, the Back button closes it, and a shared link opens the right row.
 * Opening from the credit-cards section pre-selects the card type and returns
 * there, so that section never drops you back on the plain accounts list.
 */
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { paramId } from "../../app/routeParams";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { Button, Overlay } from "../../components/ui";
import { AccountFormOverlay } from "./AccountFormOverlay";

export function AccountEditor() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onCards = pathname.startsWith("/credit-cards");
  const { accountId, cardId } = useParams<{ accountId: string; cardId: string }>();
  const id = paramId(accountId ?? cardId);
  const editing = id !== undefined;

  const account = useLiveQuery(
    async () => (id ? (await db.accounts.get(id)) ?? null : null),
    [id],
    undefined,
  );

  const sectionHome = onCards ? "/credit-cards" : "/accounts";
  const close = () => navigate(editing && id ? `${onCards ? "/credit-cards" : "/accounts"}/${id}` : sectionHome);

  if (editing && account === undefined) {
    return <Overlay open onClose={close} title="Loading account" variant="sheet" size="md">
      <p role="status" className="text-sm text-muted">Loading your saved account…</p>
    </Overlay>;
  }

  if (editing && (!account || account.deleted_at)) {
    return (
      <Overlay
        open
        onClose={() => navigate(sectionHome)}
        title="Account not found"
        description="It may have been deleted on another device, or the link is out of date."
        variant="sheet"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => navigate(sectionHome)}>
            Back
          </Button>
        }
      >
        <p className="text-sm text-muted">Nothing here matches a stored account.</p>
      </Overlay>
    );
  }

  // `AccountFormOverlay` owns its own state, so it is keyed by id: switching
  // between rows remounts it rather than carrying stale fields across.
  return (
    <AccountFormOverlay
      key={id ?? "new"}
      open
      onClose={close}
      account={account ?? undefined}
      defaultType={onCards && !editing ? "credit" : undefined}
    />
  );
}
