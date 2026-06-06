import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function RequestDemoModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '1-10'
  });

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);

    // Simulate lead capture sending
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success('Demo request submitted successfully!');
    }, 1500);
  };

  const handleReset = () => {
    setSuccess(false);
    setFormData({ name: '', email: '', company: '', teamSize: '1-10' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Shadow Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="w-full max-w-[440px] bg-[#0d1e33]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden font-sans text-slate-200"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a1727]/80">
                <div className="flex items-center gap-2">
                  <div className="bg-accent/15 p-2 rounded-lg text-accent">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Request AegisHire Demo</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Explore our AI evaluations and question generation</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-secondary/40 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {!success ? (
                    <motion.form 
                      key="form"
                      onSubmit={handleSubmit} 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Your Name</label>
                        <Input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Jane Doe"
                          className="bg-card/40 border-white/10 text-white placeholder-gray-600 focus-visible:ring-accent/20"
                        />
                      </div>

                      {/* Email input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Work Email</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="jane@company.com"
                          className="bg-card/40 border-white/10 text-white placeholder-gray-600 focus-visible:ring-accent/20"
                        />
                      </div>

                      {/* Company input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Company Name</label>
                        <Input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Acme Corp"
                          className="bg-card/40 border-white/10 text-white placeholder-gray-600 focus-visible:ring-accent/20"
                        />
                      </div>

                      {/* Team Size Select */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hiring Team Size</label>
                        <select
                          value={formData.teamSize}
                          onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                          className="w-full bg-[#11243b] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/40"
                        >
                          <option value="1-10">1 - 10 members</option>
                          <option value="11-50">11 - 50 members</option>
                          <option value="51-200">51 - 200 members</option>
                          <option value="200+">200+ members</option>
                        </select>
                      </div>

                      {/* CTA Submit */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-xs h-10 mt-2 gap-2 flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Scheduling Demo...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Submit Request</span>
                          </>
                        )}
                      </Button>
                    </motion.form>
                  ) : (
                    /* Success screen */
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="w-14 h-14 bg-[#14B8A6]/10 text-[#14B8A6] rounded-full flex items-center justify-center mx-auto border border-[#14B8A6]/20">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-bold text-white">We've Received Your Request!</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                          Thank you for your interest, <strong className="text-white">{formData.name}</strong>. An AI recruitment advisor will email you at <strong className="text-white">{formData.email}</strong> within 2 hours to confirm your custom Sandbox demo.
                        </p>
                      </div>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="mt-2 border-white/10 hover:bg-secondary/40 text-xs font-semibold h-9 px-6"
                      >
                        Back to Home
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RequestDemoModal;
