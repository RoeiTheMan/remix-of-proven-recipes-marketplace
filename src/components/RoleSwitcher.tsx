import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const ROLES: Role[] = ["guest", "buyer", "creator", "admin"];

export function RoleSwitcher() {
  const { role, setRole } = useAuth();
  return (
    <div className="flex items-center gap-2">
      <span className="label-eyebrow hidden sm:inline">Demo role</span>
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="h-8 w-[120px] text-xs uppercase tracking-wider">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
