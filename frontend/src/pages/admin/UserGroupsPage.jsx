import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { usersService } from '@/services/users.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Users, Briefcase, Award, GraduationCap, Loader2, ArrowUpRight, HelpCircle } from 'lucide-react';

const GROUPS_META = {
  admin: {
    title: 'Administrators',
    desc: 'System administrators with full global settings configuration rights.',
    icon: Shield,
    color: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-[#3B82F6] border-[#3B82F6]/25',
    avatarChar: 'A',
  },
  manager: {
    title: 'Hiring Managers',
    desc: 'Managers who create job positions, review shortlisted metrics, and grade exams.',
    icon: Briefcase,
    color: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/25',
    avatarChar: 'M',
  },
  hr: {
    title: 'HR Recruiters',
    desc: 'Recruitment managers who upload resumes, evaluate scores, and coordinate interviews.',
    icon: Award,
    color: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-purple-400 border-purple-500/25',
    avatarChar: 'H',
  },
  candidate: {
    title: 'Candidates',
    desc: 'Applicants who login to execute technical tests and check recruitment updates.',
    icon: GraduationCap,
    color: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/25',
    avatarChar: 'C',
  },
};

export function UserGroupsPage() {
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);

  const { data, loading } = useApi(usersService.getAll);
  const users = data || [];

  // Partition users into groups
  const groupsData = {
    admin: users.filter((u) => u.role?.toLowerCase() === 'admin'),
    manager: users.filter((u) => u.role?.toLowerCase() === 'manager'),
    hr: users.filter((u) => u.role?.toLowerCase() === 'hr'),
    candidate: users.filter((u) => u.role?.toLowerCase() === 'candidate'),
  };

  const selectedGroup = selectedGroupKey ? GROUPS_META[selectedGroupKey] : null;
  const selectedGroupUsers = selectedGroupKey ? groupsData[selectedGroupKey] : [];

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[#1a2e46]">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-white">Access Roles & Groups</h2>
          <p className="text-xs text-gray-400 mt-1">Review system groups partitioned by security profiles and member catalogs.</p>
        </div>
      </div>

      {/* Grid of Groups */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
          <p className="text-xs text-gray-400">Restoring group details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(GROUPS_META).map(([key, meta]) => {
            const GroupIcon = meta.icon;
            const members = groupsData[key] || [];

            return (
              <Card
                key={key}
                onClick={() => setSelectedGroupKey(key)}
                className={`bg-[#0d1e33] border-[#1a2e46] text-white hover:border-[#3B82F6]/30 cursor-pointer transition-all duration-300 transform hover:scale-[1.01]`}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                  <div className={`p-3 rounded-xl border ${meta.color}`}>
                    <GroupIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <CardTitle className="text-md font-bold">{meta.title}</CardTitle>
                    <p className="text-xs text-[#3B82F6] font-semibold tracking-wider mt-0.5">{members.length} members</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-500 self-start mt-1" />
                </CardHeader>
                <CardContent className="text-left pt-2 pb-6">
                  <p className="text-xs text-gray-400 leading-relaxed">{meta.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* User Group Member Details Dialog */}
      <Dialog open={!!selectedGroupKey} onOpenChange={(open) => !open && setSelectedGroupKey(null)}>
        <DialogContent className="bg-[#0c1a2d] border-[#1a2e46] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGroup && (
                <>
                  <div className={`p-2 rounded-lg border text-sm ${selectedGroup.color}`}>
                    {selectedGroup.avatarChar}
                  </div>
                  <span>{selectedGroup.title} Directory</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Total of {selectedGroupUsers.length} members assigned to this system role.
            </DialogDescription>
          </DialogHeader>

          {/* Members List */}
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 mt-4 select-none">
            {selectedGroupUsers.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500">
                <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                No active users belong to this security group.
              </div>
            ) : (
              selectedGroupUsers.map((usr) => (
                <div key={usr.id} className="flex items-center justify-between p-3 bg-[#11243b]/40 rounded-lg border border-[#1a2e46]/60">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-[#1a2e46]">
                      <AvatarFallback className="bg-[#11243b] text-[#3B82F6] text-[10px] font-bold">
                        {usr.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{usr.fullName}</p>
                      <p className="text-[10px] text-gray-400">@{usr.username} • {usr.email || 'No email'}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                    usr.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {usr.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1a2e46] mt-4">
            <Button
              onClick={() => setSelectedGroupKey(null)}
              className="bg-transparent hover:bg-[#11243b] text-white border border-[#1a2e46] text-xs font-semibold px-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
export default UserGroupsPage;
