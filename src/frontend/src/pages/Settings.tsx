import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetTenantMembers } from "../hooks/useQueries";
import { Copy, Check, ShieldCheck, Users as UsersIcon, Eye, Loader2, AlertCircle, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Role } from "../backend";
import { Principal } from "@dfinity/principal";
import { useActor } from "../hooks/useActor";
import { useQueryClient } from "@tanstack/react-query";
import { getToastErrorMessage } from "../lib/errorMessages";
import { InlineError } from "../components/InlineError";

/**
 * Truncate a principal for display
 */
function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}

/**
 * Get role badge styling and icon
 */
function getRoleBadgeConfig(role: Role): {
  className: string;
  icon: typeof ShieldCheck | typeof UsersIcon | typeof Eye;
  label: string;
} {
  switch (role) {
    case Role.Admin:
      return {
        className: "bg-success text-white hover:bg-success/90",
        icon: ShieldCheck,
        label: "Admin",
      };
    case Role.Member:
      return {
        className: "bg-info text-white hover:bg-info/90",
        icon: UsersIcon,
        label: "Member",
      };
    case Role.Viewer:
      return {
        className: "bg-muted text-muted-foreground hover:bg-muted/90",
        icon: Eye,
        label: "Viewer",
      };
  }
}

export default function Settings() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: members, isLoading, isError } = useGetTenantMembers();
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);
  
  // Invite form state
  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(Role.Member);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [principalError, setPrincipalError] = useState<string | null>(null);

  // Role management state
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString() || "";
  
  // Find current user's role from members list
  const currentUserMembership = members?.find(
    (m) => m.user.toString() === currentUserPrincipal
  );

  const isCurrentUserAdmin = currentUserMembership?.role === Role.Admin;

  const handleCopyPrincipal = (principal: string) => {
    navigator.clipboard.writeText(principal);
    setCopiedPrincipal(principal);
    toast.success("Principal ID copied to clipboard!");
    setTimeout(() => setCopiedPrincipal(null), 2000);
  };

  const validatePrincipal = (input: string): boolean => {
    if (!input.trim()) {
      setPrincipalError("Principal ID is required");
      return false;
    }

    // Basic format check - Principal IDs are alphanumeric with hyphens
    const principalRegex = /^[a-z0-9-]+$/i;
    if (!principalRegex.test(input.trim())) {
      setPrincipalError("Invalid Principal ID format. Should contain only letters, numbers, and hyphens");
      return false;
    }

    // Try to parse as Principal
    try {
      Principal.fromText(input.trim());
      setPrincipalError(null);
      return true;
    } catch (e) {
      setPrincipalError("Invalid Principal ID. Please check the format");
      return false;
    }
  };

  const handleAddMember = async () => {
    if (!actor) {
      toast.error("Backend not initialized");
      return;
    }

    // Validate input
    if (!validatePrincipal(principalInput)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const principal = Principal.fromText(principalInput.trim());
      
      await actor.addMemberByPrincipal(principal, selectedRole);
      
      toast.success("Team member added successfully!");
      
      // Clear form
      setPrincipalInput("");
      setSelectedRole(Role.Member);
      setPrincipalError(null);
      
      // Refresh team members list
      queryClient.invalidateQueries({ queryKey: ["tenantMembers"] });
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error(getToastErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberPrincipalStr: string, newRole: Role) => {
    if (!actor) {
      toast.error("Backend not initialized");
      return;
    }

    setUpdatingRole(memberPrincipalStr);

    try {
      const principal = Principal.fromText(memberPrincipalStr);
      
      await actor.updateMemberRole(principal, newRole);
      
      toast.success("Role updated successfully!");
      
      // Refresh team members list
      queryClient.invalidateQueries({ queryKey: ["tenantMembers"] });
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error(getToastErrorMessage(error));
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberPrincipalStr: string) => {
    if (!actor) {
      toast.error("Backend not initialized");
      return;
    }

    setRemovingMember(memberPrincipalStr);

    try {
      const principal = Principal.fromText(memberPrincipalStr);
      
      await actor.removeMember(principal);
      
      toast.success("Team member removed successfully!");
      
      // Refresh team members list
      queryClient.invalidateQueries({ queryKey: ["tenantMembers"] });
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error(getToastErrorMessage(error));
    } finally {
      setRemovingMember(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and team settings
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                General account configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Your Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Account</CardTitle>
              <CardDescription>
                Your Internet Identity Principal and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Principal ID */}
              <div className="space-y-2">
                <Label>Your Principal ID</Label>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <code className="flex-1 px-3 py-2 rounded-md bg-muted font-mono text-sm border border-border cursor-help">
                          {truncatePrincipal(currentUserPrincipal)}
                        </code>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm break-all">
                        <p className="font-mono text-xs">{currentUserPrincipal}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyPrincipal(currentUserPrincipal)}
                  >
                    {copiedPrincipal === currentUserPrincipal ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share your Principal ID with team admins to be added to their organization
                </p>
              </div>

              {/* Current Role */}
              <div className="space-y-2">
                <Label>Your Role</Label>
                {currentUserMembership ? (
                  (() => {
                    const config = getRoleBadgeConfig(currentUserMembership.role);
                    const Icon = config.icon;
                    return (
                      <div>
                        <Badge className={config.className}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })()
                ) : (
                  <Badge variant="outline" className="bg-muted">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unable to determine role
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invite Team Member Section (Admin Only) */}
          {isCurrentUserAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Add a new team member by their Internet Identity Principal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Principal ID Input */}
                  <div className="space-y-2">
                    <Label htmlFor="principal-input">Principal ID</Label>
                    <Input
                      id="principal-input"
                      placeholder="e.g., abc12-defgh-34567-ijklm-nopqr-stuvw-xyzab-cdefg-hijkl-mnopq-rst"
                      value={principalInput}
                      onChange={(e) => {
                        setPrincipalInput(e.target.value);
                        setPrincipalError(null);
                      }}
                      disabled={isSubmitting}
                      className={principalError ? "border-destructive" : ""}
                    />
                    {principalError && <InlineError message={principalError} />}
                    <p className="text-xs text-muted-foreground">
                      The user must share their Principal ID with you (found in their Account settings)
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role-select">Role</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => setSelectedRole(value as Role)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="role-select">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.Admin}>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin</span>
                            <span className="text-xs text-muted-foreground">- Full access</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={Role.Member}>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4" />
                            <span>Member</span>
                            <span className="text-xs text-muted-foreground">- Can manage webhooks</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={Role.Viewer}>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>Viewer</span>
                            <span className="text-xs text-muted-foreground">- Read-only access</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the level of access for this team member
                    </p>
                  </div>

                  {/* Add Member Button */}
                  <Button
                    onClick={handleAddMember}
                    disabled={isSubmitting || !principalInput.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Member...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View all members of your organization and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Failed to load team members</span>
                </div>
              ) : !members || members.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>No team members found</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Principal ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const memberPrincipal = member.user.toString();
                        const isCurrentUser = memberPrincipal === currentUserPrincipal;
                        const config = getRoleBadgeConfig(member.role);
                        const Icon = config.icon;
                        const isUpdating = updatingRole === memberPrincipal;
                        const isRemoving = removingMember === memberPrincipal;

                        return (
                          <TableRow key={memberPrincipal}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <code className="font-mono text-sm cursor-help">
                                        {truncatePrincipal(memberPrincipal)}
                                      </code>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm break-all">
                                      <p className="font-mono text-xs">{memberPrincipal}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyPrincipal(memberPrincipal)}
                                >
                                  {copiedPrincipal === memberPrincipal ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isCurrentUserAdmin && !isCurrentUser ? (
                                // Show dropdown for Admins (except for their own role)
                                <Select
                                  value={member.role}
                                  onValueChange={(value) => handleUpdateRole(memberPrincipal, value as Role)}
                                  disabled={isUpdating || isRemoving}
                                >
                                  <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue>
                                      {isUpdating ? (
                                        <span className="flex items-center gap-2">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span className="text-xs">Updating...</span>
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <Icon className="w-3 h-3" />
                                          <span className="text-xs">{config.label}</span>
                                        </span>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={Role.Admin}>
                                      <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Admin</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value={Role.Member}>
                                      <div className="flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Member</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value={Role.Viewer}>
                                      <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        <span>Viewer</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                // Show static badge for non-Admins or current user
                                <Badge className={config.className}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isCurrentUserAdmin && !isCurrentUser && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isUpdating || isRemoving}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      {isRemoving ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          Removing...
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          Remove
                                        </>
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove{" "}
                                        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                                          {truncatePrincipal(memberPrincipal)}
                                        </code>{" "}
                                        from your team? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveMember(memberPrincipal)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Remove Member
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
