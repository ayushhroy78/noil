import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Shield, Landmark, UserCheck, Search, Trash2, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  userId: string;
  email: string;
  roles: AppRole[];
  fullName: string | null;
}

const ROLE_CONFIG: Record<AppRole | "policymaker", { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin", icon: <Shield className="w-3 h-3" />, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  moderator: { label: "Moderator", icon: <UserCheck className="w-3 h-3" />, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  policymaker: { label: "Policymaker", icon: <Landmark className="w-3 h-3" />, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  user: { label: "User", icon: <Users className="w-3 h-3" />, color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" }
};

export const UserRoleManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("policymaker");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch user profiles to get emails/names
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, full_name");

      if (profilesError) throw profilesError;

      // Group roles by user
      const userRolesMap: Record<string, AppRole[]> = {};
      rolesData?.forEach((r) => {
        if (!userRolesMap[r.user_id]) {
          userRolesMap[r.user_id] = [];
        }
        userRolesMap[r.user_id].push(r.role as AppRole);
      });

      // Combine with profile data
      const usersWithRoles: UserWithRoles[] = Object.entries(userRolesMap).map(([userId, roles]) => {
        const profile = profilesData?.find(p => p.user_id === userId);
        return {
          userId,
          email: userId.slice(0, 8) + "...", // Truncated for privacy
          fullName: profile?.full_name || null,
          roles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user email or ID",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // First, try to find user by email in profiles
      let userId = newUserEmail.trim();
      
      // Check if it's an email pattern
      if (newUserEmail.includes("@")) {
        // For now, we can't directly query auth.users, so inform the admin
        toast({
          title: "Note",
          description: "Please use the user ID (UUID) instead of email. You can find this in the user's profile URL.",
          variant: "default"
        });
        setProcessing(false);
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", newUserRole as AppRole)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Role Already Exists",
          description: "This user already has this role assigned.",
          variant: "default"
        });
        setProcessing(false);
        return;
      }

      // Add the role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: newUserRole as AppRole
        });

      if (error) throw error;

      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${ROLE_CONFIG[newUserRole as AppRole]?.label || newUserRole} role.`
      });

      setShowAddDialog(false);
      setNewUserEmail("");
      setNewUserRole("policymaker");
      fetchUsersWithRoles();
    } catch (error: any) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role. Make sure the user ID is valid.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `Successfully removed ${ROLE_CONFIG[role]?.label || role} role.`
      });

      fetchUsersWithRoles();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleBadge = (role: AppRole) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Assign admin, moderator, or policymaker roles to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user ID, name, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Role
          </Button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No users with special roles found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    {user.fullName || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {user.userId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.roles.map((role) => (
                    <div key={role} className="flex items-center gap-1">
                      {getRoleBadge(role)}
                      <button
                        onClick={() => handleRemoveRole(user.userId, role)}
                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                        title="Remove role"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.roles.includes("admin")).length}
            </p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.roles.includes("policymaker" as AppRole)).length}
            </p>
            <p className="text-xs text-muted-foreground">Policymakers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.roles.includes("moderator")).length}
            </p>
            <p className="text-xs text-muted-foreground">Moderators</p>
          </div>
        </div>
      </CardContent>

      {/* Add Role Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Enter the user's ID (UUID) and select the role to assign.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find user IDs in the community profiles or database
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policymaker">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-purple-600" />
                      Policymaker
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Moderator
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
