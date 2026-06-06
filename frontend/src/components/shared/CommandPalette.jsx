/**
 * components/shared/CommandPalette.jsx
 *
 * Global command palette — activated with Ctrl+K or Cmd+K.
 * Provides keyboard-driven navigation across the entire ATS.
 *
 * Usage (mount once in AppShell.jsx):
 *   <CommandPalette />
 */
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';

// ─── Command registry ────────────────────────────────────────────────────────

const ALL_COMMANDS = [
  // Navigation
  { id: 'nav-hr',         label: 'Go to HR Dashboard',           icon: '📊', action: 'navigate', path: '/hr',                  roles: [3] },
  { id: 'nav-upload',     label: 'Upload Resume',                 icon: '📄', action: 'navigate', path: '/hr/upload',           roles: [3] },
  { id: 'nav-evaluate',   label: 'Evaluate Candidates',           icon: '🤖', action: 'navigate', path: '/hr/evaluate',         roles: [3] },
  { id: 'nav-pipeline',   label: 'Open Pipeline Board',           icon: '📋', action: 'navigate', path: '/hr/pipeline',         roles: [3] },
  { id: 'nav-interviews', label: 'Interview Scheduling',          icon: '🗓️', action: 'navigate', path: '/hr/interviews',       roles: [3] },
  { id: 'nav-finalised',  label: 'Finalised Candidates',          icon: '✅', action: 'navigate', path: '/hr/finalised',        roles: [3] },
  { id: 'nav-generate',   label: 'Generate Exam Questions',       icon: '📝', action: 'navigate', path: '/hr/generate',         roles: [3] },

  { id: 'nav-manager',    label: 'Go to Manager Dashboard',       icon: '📊', action: 'navigate', path: '/manager',             roles: [2] },
  { id: 'nav-jobs',       label: 'Create Job Requirement',        icon: '💼', action: 'navigate', path: '/manager/jobs',        roles: [2] },
  { id: 'nav-shortlist',  label: 'Review Shortlist',              icon: '⭐', action: 'navigate', path: '/manager/shortlist',   roles: [2] },
  { id: 'nav-perf',       label: 'Candidate Performance',         icon: '📈', action: 'navigate', path: '/manager/performance', roles: [2] },

  { id: 'nav-admin',      label: 'Go to Admin Dashboard',         icon: '⚙️', action: 'navigate', path: '/admin',              roles: [1] },
  { id: 'nav-users',      label: 'Manage Users',                  icon: '👥', action: 'navigate', path: '/admin/users',         roles: [1] },
  { id: 'nav-add-user',   label: 'Add New User',                  icon: '➕', action: 'navigate', path: '/admin/users/add',    roles: [1] },
];

// ─── Styles (inline to avoid CSS coupling) ──────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
  },
  panel: {
    width: '100%',
    maxWidth: '580px',
    background: 'rgba(13,31,53,0.98)',
    border: '1px solid rgba(46,213,115,0.25)',
    borderRadius: '14px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,213,115,0.1)',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '18px 20px',
    fontSize: '16px',
    color: '#f1f5f9',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
  },
  list: {
    maxHeight: '380px',
    overflowY: 'auto',
    padding: '8px',
  },
  item: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    background: isActive ? 'rgba(46,213,115,0.12)' : 'transparent',
    border: isActive ? '1px solid rgba(46,213,115,0.2)' : '1px solid transparent',
    transition: 'all 0.15s ease',
    marginBottom: '2px',
  }),
  itemIcon: {
    fontSize: '18px',
    flexShrink: 0,
    width: '28px',
    textAlign: 'center',
  },
  itemLabel: {
    fontSize: '14px',
    color: '#e2e8f0',
    fontWeight: '500',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  footer: {
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    gap: '16px',
    fontSize: '11px',
    color: '#475569',
  },
  kbd: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    padding: '1px 5px',
    fontSize: '10px',
    color: '#94a3b8',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { roleid } = useContext(AuthContext);

  // Filter commands by role and query
  const filtered = ALL_COMMANDS.filter((cmd) => {
    const roleMatch = !cmd.roles || cmd.roles.includes(roleid);
    const queryMatch = !query || cmd.label.toLowerCase().includes(query.toLowerCase());
    return roleMatch && queryMatch;
  });

  const execute = useCallback((cmd) => {
    setOpen(false);
    setQuery('');
    if (cmd.action === 'navigate') {
      navigate(cmd.path);
    }
  }, [navigate]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setActiveIdx(0);
      }

      if (!open) return;

      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[activeIdx]) {
        execute(filtered[activeIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, activeIdx, execute]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset activeIdx when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={() => setOpen(false)}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <input
          ref={inputRef}
          id="command-palette-input"
          style={styles.input}
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* Results list */}
        <div style={styles.list}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No commands found for "{query}"</div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                style={styles.item(idx === activeIdx)}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => execute(cmd)}
              >
                <span style={styles.itemIcon}>{cmd.icon}</span>
                <span style={styles.itemLabel}>{cmd.label}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span><kbd style={styles.kbd}>↑↓</kbd> navigate</span>
          <span><kbd style={styles.kbd}>↵</kbd> select</span>
          <span><kbd style={styles.kbd}>Esc</kbd> close</span>
          <span style={{ marginLeft: 'auto' }}><kbd style={styles.kbd}>Ctrl K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
