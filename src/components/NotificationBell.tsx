// Header notification center. Polls lightly; marks everything read when opened.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { getNotifications, getUnreadCount, markAllRead } from "@/services/notificationsService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: getUnreadCount,
    enabled: isSignedIn,
    refetchInterval: 60_000,
  });
  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(20),
    enabled: isSignedIn && open,
  });

  if (!isSignedIn) return null;

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && unread > 0) {
      await markAllRead();
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button aria-label="Notifications" className="relative p-2 text-ink hover:text-teal">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 bg-signal text-warm text-[10px] leading-4 text-center rounded-full">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2 label-eyebrow">Notifications</div>
        <div className="max-h-80 overflow-auto">
          {items.length === 0 && <p className="p-4 text-sm text-neutral-gray">Nothing yet.</p>}
          {items.map((n) => (
            <Link
              key={n.id}
              to={n.link}
              onClick={() => setOpen(false)}
              className={"block px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary " + (n.read ? "" : "bg-teal/5")}
            >
              <div className="text-sm font-medium text-ink">{n.title}</div>
              {n.body && <div className="text-xs text-ink/70 mt-0.5">{n.body}</div>}
              <div className="text-[10px] text-neutral-gray mt-1">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
