import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { usersService } from '@/services/users.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trash2, ShieldAlert, CheckCircle2, XCircle, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AllUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Dialog state for deleting user
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load users list
  const { data, loading, refetch } = useApi(usersService.getAll);
  const users = data || [];

  // Delete user trigger
  async function handleDeleteConfirm() {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usersService.delete(userToDelete.id);
      toast.success(`User ${userToDelete.fullName} deleted successfully!`);
      setUserToDelete(null);
      refetch(); // Reload list
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Client-side search and filters
  const filteredUsers = users.filter((usr) => {
    const matchesSearch =
      usr.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usr.email && usr.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole === 'all' || usr.role?.toLowerCase() === selectedRole.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || usr.status?.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-[#1a2e46]">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-white">Registered Users</h2>
          <p className="text-xs text-gray-400 mt-1">Review, filter, and manage access parameters for system users.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0d1e33] p-4 rounded-lg border border-[#1a2e46]">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0 w-full"
          />
        </div>

        {/* Filter Selection dropdowns */}
        <div className="flex gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[140px] bg-[#11243b] border-[#1a2e46] text-white focus:ring-0">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="hr">HR Manager</SelectItem>
              <SelectItem value="candidate">Candidate</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px] bg-[#11243b] border-[#1a2e46] text-white focus:ring-0">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d1e33] border border-[#1a2e46] rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            <p className="text-xs text-gray-400">Loading user catalog...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="h-10 w-10 text-gray-500" />
            <p className="text-sm font-semibold text-gray-400">No users found matching criteria</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
              <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                <TableHead className="text-gray-400 font-semibold w-[60px]"></TableHead>
                <TableHead className="text-gray-400 font-semibold">User Details</TableHead>
                <TableHead className="text-gray-400 font-semibold">Username</TableHead>
                <TableHead className="text-gray-400 font-semibold">Role</TableHead>
                <TableHead className="text-gray-400 font-semibold">Department</TableHead>
                <TableHead className="text-gray-400 font-semibold">Status</TableHead>
                <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((usr) => (
                <TableRow key={usr.id} className="hover:bg-[#11243b]/25 border-b border-[#1a2e46]/60">
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-[#11243b] text-[#3B82F6] flex items-center justify-center font-bold text-xs border border-[#1a2e46]">
                      {usr.initials}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{usr.fullName}</p>
                      <p className="text-xs text-gray-400">{usr.email || 'No email'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-300">@{usr.username}</TableCell>
                  <TableCell className="text-sm text-gray-300 capitalize">{usr.role}</TableCell>
                  <TableCell className="text-sm text-gray-400">{usr.department || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      usr.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {usr.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{usr.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUserToDelete(usr)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="bg-[#0c1a2d] border-[#1a2e46] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5.5 w-5.5" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Are you sure you want to delete user account <strong>{userToDelete?.fullName}</strong> (username: <strong>@{userToDelete?.username}</strong>)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setUserToDelete(null)}
              className="bg-transparent border-[#1a2e46] text-white hover:bg-[#11243b]"
            >
              Cancel
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white mr-1.5" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Account</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
export default AllUsersPage;
