import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "@/components/shared/app-link";
import { useAppAuth } from "@/lib/app-auth-context";

export default function AccountMenu() {
  const { user, signOut } = useAppAuth();
  const accountLabel = user?.firstName || user?.fullName || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="cr-account-button" aria-label="Account menu" data-testid="button-account-menu">
          {user?.imageUrl ? <img src={user.imageUrl} alt="" /> : <span aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-56 rounded-xl border-border bg-popover p-1.5 shadow-xl">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold">{user?.fullName || accountLabel}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/workspace" className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold" data-testid="link-workspace">Your workspace</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut({ redirectUrl: "/" })} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
