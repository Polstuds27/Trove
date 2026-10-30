import { useState } from "react";
import { Banknote, CreditCard } from "lucide-react";
import { bankByName } from "../../design/banks";

/** Shared account identity, including when logos cannot load offline. */
export function AccountAvatar({ account, size = 40, className = "" }: {
  account: { bank_name?: string | null; type?: string };
  size?: number;
  className?: string;
}) {
  const bank = bankByName(account.bank_name);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const cash = bank?.name === "Cash" || (!account.bank_name && account.type === "cash");
  const Icon = cash ? Banknote : CreditCard;
  const logo = bank?.logo;
  return (
    <span role="img" aria-label={bank?.name ?? (cash ? "Cash" : account.bank_name || "Other bank")}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken text-primary ${className}`}>
      {logo && failedLogo !== logo ? (
        <img src={`/icons/bank-icons/${logo}`} alt="" className="h-full w-full object-cover" onError={() => setFailedLogo(logo)} />
      ) : <Icon aria-hidden="true" style={{ width: size * 0.45, height: size * 0.45 }} />}
    </span>
  );
}
