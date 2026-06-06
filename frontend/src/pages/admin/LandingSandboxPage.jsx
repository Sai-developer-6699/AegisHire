import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientMesh } from '@/components/effects/GradientMesh';
import { ProductPreviewCard } from '@/components/shared/ProductPreviewCard';
import { ComparisonDemo } from '@/components/shared/ComparisonDemo';
import { RequestDemoModal } from '@/components/shared/RequestDemoModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Layout, Shield, Calendar, RefreshCw } from 'lucide-react';

export function LandingSandboxPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const handleRefreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="relative min-h-screen -m-8 p-8 overflow-hidden bg-[#0a1220]">
      {/* Premium Gradient Mesh Background */}
      <GradientMesh />

      <PageWrapper className="relative z-10 space-y-8 select-none text-white font-sans max-w-5xl mx-auto">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#3B82F6] animate-pulse" />
              <span>Landing Page Asset Sandbox</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Verify Framer Motion animations, typography weight, and interactive modals in isolation.</p>
          </div>
          <Button
            onClick={handleRefreshPreview}
            variant="outline"
            className="bg-secondary border-white/10 text-gray-300 hover:text-white shrink-0 text-xs h-9 gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Replay Animations</span>
          </Button>
        </div>

        {/* Section 1: Typography Audit */}
        <Card className="bg-[#0d1e33]/55 border-white/10 backdrop-blur-md text-white">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-400">Typography Scale (Outfit & Inter)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-accent tracking-widest block mb-1">Font Heading (Outfit)</span>
              <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white leading-tight">
                AI-Powered Recruitment Platform
              </h2>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-accent tracking-widest block mb-1">Font Sans Body (Inter)</span>
              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                AegisHire extracts resumes, performs deterministic skill-matrix scoring, generates exam blueprints, and prepares your hiring teams with AI-grounded interview questions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Mockup Widgets Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Candidate Profile Stepper */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-semibold px-1">Candidate Parsing Pipeline</h3>
            <ProductPreviewCard key={`card-${previewKey}`} autoAnimate={true} />
          </div>

          {/* AI Comparison Showcase */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-semibold px-1">Side-by-side Decision Showcase</h3>
            <ComparisonDemo key={`comp-${previewKey}`} autoAnimate={true} />
          </div>

        </div>

        {/* Section 3: Lead Capture Modal Trigger */}
        <Card className="bg-[#0d1e33]/55 border-white/10 backdrop-blur-md text-white p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Modal Harness</h4>
              <p className="text-xs text-gray-400 mt-1">Triggers the popup form to request a product demo.</p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs h-10 px-6"
            >
              Open Demo Modal
            </Button>
          </div>
        </Card>

        {/* Request Demo Modal instance */}
        <RequestDemoModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />

      </PageWrapper>
    </div>
  );
}

export default LandingSandboxPage;
