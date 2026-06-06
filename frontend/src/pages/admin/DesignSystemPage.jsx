import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormError } from '@/components/shared/FormError';
import { StandardDialog } from '@/components/shared/StandardDialog';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Play, Check, AlertTriangle, AlertCircle, FileText, Search, User } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DesignSystemPage (/admin/design-system)
 * Serves as AegisHire's central Storybook & Design QA Center.
 */
export function DesignSystemPage() {
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'confirmation', title: '', desc: '' });
  const [testInputError, setTestInputError] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  const triggerDialog = (type, title, desc) => {
    setDialogState({ isOpen: true, type, title, desc });
  };

  const tableColumns = [
    { header: 'Candidate', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Match Score', accessor: (row) => <ScoreBadge score={row.score} /> },
  ];

  const tableData = [
    { name: 'Adan O P', email: 'adan@example.com', status: 'shortlisted', score: 85.0 },
    { name: 'John Doe', email: 'john.doe@example.com', status: 'evaluated', score: 75.0 },
    { name: 'Sai Cheranjeeve', email: 'sai@example.com', status: 'approved', score: 62.5 },
  ];

  return (
    <div className="space-y-8 p-6 pb-16 text-left select-none max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Design QA & Component Center</h1>
        <p className="text-xs text-muted-foreground mt-1.5">
          Verifying AegisHire UI token standards, input validation behaviors, and ATS component states.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Colors & Tokens */}
        <Card className="bg-card border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">Design Palette Tokens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground border border-border/40">
              <p className="text-xs font-bold">Primary (Royal Indigo)</p>
              <span className="text-[10px] opacity-75">bg-primary</span>
            </div>
            <div className="p-3 rounded-lg bg-accent text-accent-foreground border border-border/40">
              <p className="text-xs font-bold">Accent (Cobalt Blue)</p>
              <span className="text-[10px] opacity-75">bg-accent</span>
            </div>
            <div className="p-3 rounded-lg bg-success text-success-foreground border border-border/40">
              <p className="text-xs font-bold">Success (Mint Teal)</p>
              <span className="text-[10px] opacity-75">bg-success</span>
            </div>
            <div className="p-3 rounded-lg bg-warning text-warning-foreground border border-border/40">
              <p className="text-xs font-bold">Warning (Amber Orange)</p>
              <span className="text-[10px] opacity-75">bg-warning</span>
            </div>
            <div className="p-3 rounded-lg bg-error text-error-foreground border border-border/40 col-span-2">
              <p className="text-xs font-bold">Error / Destructive (Rose Red)</p>
              <span className="text-[10px] opacity-75">bg-error / bg-destructive</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Button Sandbox */}
        <Card className="bg-card border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">Button States Sandbox</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            <Button variant="default">Default Primary</Button>
            <Button variant="outline">Outline Option</Button>
            <Button variant="secondary">Secondary View</Button>
            <Button variant="destructive">Destructive Action</Button>
            <Button variant="ghost">Ghost Trigger</Button>
            <Button disabled>Disabled Button</Button>
          </CardContent>
        </Card>

        {/* Input Validation Sandbox */}
        <Card className="bg-card border-border/60 shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">Form Inputs & Validation states</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Default Input</label>
                <Input placeholder="Enter username" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-semibold">Disabled Input</label>
                <Input placeholder="Not editable" disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-semibold">Read Only Input</label>
                <Input value="Permanent value" readOnly />
              </div>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interactive Error Trigger Harness</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-full sm:max-w-xs space-y-1.5">
                  <Input
                    placeholder="Enter invalid payload..."
                    aria-invalid={!!testInputError}
                  />
                  <FormError message={testInputError} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTestInputError('Field cannot be empty and must be a valid email format.');
                      toast.error('Validation error triggered!');
                    }}
                  >
                    Set Error State
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTestInputError('');
                      toast.success('Validation cleared.');
                    }}
                  >
                    Clear Error State
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog / Modal Trigger Sandbox */}
        <Card className="bg-card border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">Standardized Dialog Templates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerDialog('confirmation', 'Delete User Accounts?', 'This action is immutable and will wipe user data.')}
            >
              Confirmation Modal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerDialog('success', 'Resume Upload Complete', 'System successfully parsed 12 candidate records.')}
            >
              Success Dialog
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerDialog('warning', 'Low Token Threshold', 'Gemini API tokens are nearing daily free tier limits.')}
            >
              Warning Dialog
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerDialog('error', 'Authentication Timeout', 'Local database credentials rejected the session.')}
            >
              Error Modal
            </Button>
          </CardContent>
        </Card>

        {/* Toasts Test Sandbox */}
        <Card className="bg-card border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">Notification Center (Sonner Toasts)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success('Resume parsed successfully!')}>Success Toast</Button>
            <Button variant="outline" size="sm" onClick={() => toast.warning('Missing secondary skill parameters.')}>Warning Toast</Button>
            <Button variant="outline" size="sm" onClick={() => toast.error('Wrong credentials password.')}>Error Toast</Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('New pipeline task registered.')}>Info Toast</Button>
          </CardContent>
        </Card>

        {/* Standardized DataTables Showcase */}
        <Card className="bg-card border-border/60 shadow-lg md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/90">DataTable States (Loading / Populated / Empty)</CardTitle>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setTableLoading(true);
                setTimeout(() => setTableLoading(false), 1200);
              }}
            >
              Trigger Table Loading
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">DataTable with Data</h4>
              <DataTable columns={tableColumns} data={tableData} isLoading={tableLoading} />
            </div>

            <div className="border-t border-border/40 pt-6">
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider font-semibold">DataTable Empty State Showcase</h4>
              <DataTable
                columns={tableColumns}
                data={[]}
                isLoading={tableLoading}
                emptyTitle="No Job Matches Found"
                emptyDescription="Select a position requirements card above to display candidate lists."
                emptyCtaText="Reload Board"
                onEmptyCtaClick={() => toast.success('Reloading matches...')}
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Shared Dialog Instance */}
      <StandardDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        type={dialogState.type}
        title={dialogState.title}
        description={dialogState.desc}
        onConfirm={() => {
          toast.success('Action Confirmed');
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}

export default DesignSystemPage;
