import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./AuthPage.jsx";
import "./App.css";

const STATUSES = ["New", "Contacted", "Follow-up due", "Qualified", "Closed"];
const EMPTY_LEAD = {
  name: "",
  company: "",
  email: "",
  event: "",
  notes: "",
  follow_up_status: "New",
};
function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) return "Just added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_LEAD);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryLead, setSummaryLead] = useState(null);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const summaryRequestId = useRef(0);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load leads.");
      const loadedLeads = Array.isArray(data) ? data : [];
      setLeads(loadedLeads);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message || "Could not connect to the lead database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initializeSession() {
      try {
        const authResponse = await fetch("/api/auth");
        const authData = await authResponse.json();
        if (!authResponse.ok) throw new Error(authData.error || "Could not check your sign-in status.");
        const authenticated = Boolean(authData.authenticated);
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const leadResponse = await fetch("/api/leads");
          const leadData = await leadResponse.json();
          if (!leadResponse.ok) throw new Error(leadData.error || "Could not load leads.");
          setLeads(Array.isArray(leadData) ? leadData : []);
        } else {
          setLeads([]);
        }
        setLoadError("");
      } catch (error) {
        setLoadError(error.message || "Could not connect to the app server.");
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    }
    void initializeSession();
  }, []);

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery = !normalizedQuery || [lead.name, lead.company, lead.email, lead.event, lead.notes]
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "All statuses" || lead.follow_up_status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  const followUps = leads.filter((lead) => lead.follow_up_status === "Follow-up due").length;
  const qualified = leads.filter((lead) => lead.follow_up_status === "Qualified").length;

  async function handleAuthenticated() {
    setIsAuthenticated(true);
    await loadLeads();
  }

  async function signOut() {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    }
    finally {
      setIsAuthenticated(false);
      setLeads([]);
    }
  }

  if (!authChecked) return <main className="auth-page"><div className="summary-loading"><span className="spinner" /><strong>Checking sign-in…</strong></div></main>;
  if (!isAuthenticated) return <AuthPage onAuthenticated={handleAuthenticated} />;

  function openCreateForm() {
    setEditingLead(null);
    setFormValues(EMPTY_LEAD);
    setIsFormOpen(true);
  }

  function openEditForm(lead) {
    setEditingLead(lead);
    setFormValues({
      name: lead.name || "",
      company: lead.company || "",
      email: lead.email || "",
      event: lead.event || "",
      notes: lead.notes || "",
      follow_up_status: lead.follow_up_status || "New",
    });
    setIsFormOpen(true);
  }

  async function saveLead(event) {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    try {
      const editing = Boolean(editingLead);
      const response = await fetch(editing ? `/api/leads/${editingLead.id}` : "/api/leads", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this lead.");
      if (!data?.id) throw new Error("The lead was saved, but the server did not return its updated details. Refresh the page to verify it.");
      setLeads((current) => editing
        ? current.map((lead) => lead.id === data.id ? data : lead)
        : [data, ...current]);
      setNotice(editing ? "Lead updated." : "Lead added.");
      setEditingLead(null);
      setIsFormOpen(false);
      setFormValues(EMPTY_LEAD);
    } catch (error) {
      setNotice(error.message || "Could not save this lead.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Delete ${lead.name} from your leads?`)) return;
    setNotice("");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete this lead.");
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setNotice("Lead deleted.");
    } catch (error) {
      setNotice(error.message || "Could not delete this lead.");
    }
  }

  async function summarizeNotes(lead) {
    const requestId = ++summaryRequestId.current;
    setSummaryLead(lead);
    setSummary("");
    setSummaryError("");
    setIsSummarizing(false);
    if (!lead.notes?.trim()) return;

    setIsSummarizing(true);
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: lead.notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not summarize these notes.");
      if (requestId === summaryRequestId.current) setSummary(data.summary || "");
    } catch (error) {
      if (requestId === summaryRequestId.current) {
        setSummaryError(error.message || "Could not summarize these notes.");
      }
    } finally {
      if (requestId === summaryRequestId.current) setIsSummarizing(false);
    }
  }

  function closeSummary() {
    summaryRequestId.current += 1;
    setSummaryLead(null);
    setIsSummarizing(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Gather home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>gather<span className="brand-dot">.</span></span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">E</div>
          <div className="workspace-copy"><strong>Even8 Events</strong><span>Workspace</span></div>
          <span className="switch-chevron">⌄</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          <a className={`nav-item ${statusFilter === "All statuses" ? "active" : ""}`} href="#leads" onClick={() => setStatusFilter("All statuses")}><Icon name="users" size={17} /> Leads <span className="nav-count">{leads.length}</span></a>
          <a className={`nav-item ${statusFilter === "Follow-up due" ? "active" : ""}`} href="#follow-ups" onClick={() => setStatusFilter("Follow-up due")}><Icon name="calendar" size={17} /> Follow-ups</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-orb"><Icon name="spark" size={16} /></span><div><strong>Make every lead count</strong><p>Keep event conversations moving.</p></div></div>
          <div className="profile-row"><div className="profile-avatar">JD</div><div className="profile-copy"><strong>Event team</strong><span>Lead manager</span></div><span className="more-dots">···</span></div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>Leads</strong></div>
          <div className="topbar-right"><span className="live-dot" /> Owner workspace <div className="top-avatar">E</div><button className="text-button" onClick={signOut}>Sign out</button></div>
        </header>

        <div className="content-wrap" id="leads">
          <section className="page-heading">
            <div>
              <p className="eyebrow">EVENT RELATIONSHIPS <span>·</span> 2026</p>
              <h1>Your leads, <em>in good hands.</em></h1>
              <p className="page-subtitle">A little follow-through turns a great event conversation into something more.</p>
            </div>
            <button className="primary-button" onClick={openCreateForm}><Icon name="plus" size={17} /> Add a lead</button>
          </section>

          {loadError && <div className="setup-banner"><div><strong>Connect your lead database to get started</strong><p>{loadError} Add the Supabase environment values described in the README, then refresh.</p></div><button className="text-button" onClick={loadLeads}>Try again</button></div>}
          {notice && <div className="notice-bar" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="close" size={15} /></button></div>}

          <section className="stats-grid" aria-label="Lead overview">
            <article className="stat-card"><div className="stat-top"><span className="stat-icon lilac"><Icon name="users" size={18} /></span><span className="stat-period">ALL TIME</span></div><strong className="stat-number">{leads.length.toString().padStart(2, "0")}</strong><span className="stat-caption">Total leads</span></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-icon peach"><Icon name="calendar" size={18} /></span><span className="stat-period">NEEDS A NUDGE</span></div><strong className="stat-number">{followUps.toString().padStart(2, "0")}</strong><span className="stat-caption">Follow-ups due</span></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-icon mint"><Icon name="arrow" size={17} /></span><span className="stat-period">IN THE PIPELINE</span></div><strong className="stat-number">{qualified.toString().padStart(2, "0")}</strong><span className="stat-caption">Qualified leads</span></article>
            <article className="ai-card"><div className="ai-card-heading"><span className="ai-burst"><Icon name="spark" size={17} /></span><span>YOUR AI SIDEKICK</span><span className="ai-pill">BETA</span></div><p>Turn your event notes into a concise summary in one click.</p><span className="ai-card-foot">BASED ON YOUR NOTES <span>✳</span></span></article>
          </section>

          <section className="leads-section" id="follow-ups">
            <div className="section-heading"><div><h2>Lead directory</h2><p>Your event conversations, all in one place.</p></div><span className="result-count">{visibleLeads.length} {visibleLeads.length === 1 ? "lead" : "leads"}</span></div>
            <div className="toolbar">
              <label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, companies, notes..." aria-label="Search leads" /></label>
              <label className="filter-box"><Icon name="filter" size={17} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by follow-up status"><option>All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
            </div>

            <div className="lead-list">
              {isLoading ? <div className="list-state"><span className="spinner" /> Loading your leads…</div> : visibleLeads.length === 0 ? (
                <div className="empty-state"><div className="empty-illustration"><span>✳</span><span>↗</span><span>✦</span></div><h3>{query || statusFilter !== "All statuses" ? "No leads match those filters" : "The next great connection starts here"}</h3><p>{query || statusFilter !== "All statuses" ? "Try a different search or status." : "Add someone you met at an event and keep the conversation going."}</p>{!query && statusFilter === "All statuses" && <button className="secondary-button" onClick={openCreateForm}><Icon name="plus" size={16} /> Add your first lead</button>}</div>
              ) : (
                <>
                  <div className="table-head"><span>CONTACT</span><span>EVENT</span><span>FOLLOW-UP</span><span>ADDED</span><span>ACTIONS</span></div>
                  {visibleLeads.map((lead, index) => (
                    <article className="lead-row" key={lead.id}>
                      <div className="contact-cell"><div className={`lead-avatar avatar-${index % 5}`}>{initials(lead.name)}</div><div className="contact-copy"><strong>{lead.name}</strong><span>{lead.company || "Company not added"}</span><a href={`mailto:${lead.email}`}>{lead.email}</a></div></div>
                      <div className="event-cell"><span className="event-dot" /><div><strong>{lead.event || "Event not added"}</strong><span>{lead.notes ? `${lead.notes.slice(0, 54)}${lead.notes.length > 54 ? "…" : ""}` : "No notes yet"}</span></div></div>
                      <div><span className={`status-badge status-${lead.follow_up_status?.toLowerCase().replaceAll(" ", "-") || "new"}`}><span />{lead.follow_up_status || "New"}</span></div>
                      <div className="date-cell">{formatDate(lead.created_at)}</div>
                      <div className="row-actions"><button className="summary-action" title="AI Summary" aria-label={`Summarize notes for ${lead.name}`} onClick={() => summarizeNotes(lead)}><Icon name="spark" size={15} /><span>AI Summary</span></button><button className="icon-button" title="Edit lead" aria-label={`Edit ${lead.name}`} onClick={() => openEditForm(lead)}><Icon name="edit" size={16} /></button><button className="icon-button danger-action" title="Delete lead" aria-label={`Delete ${lead.name}`} onClick={() => deleteLead(lead)}><Icon name="trash" size={16} /></button></div>
                    </article>
                  ))}
                </>
              )}
            </div>
            <p className="privacy-note"><span>✳</span> AI summaries are based only on the saved conversation notes.</p>
          </section>
          <footer className="footer-note"><span>Made for people who make events happen.</span><span>GATHER <b>·</b> EVEN8</span></footer>
        </div>
      </main>

      {isFormOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditingLead(null); setFormValues(EMPTY_LEAD); setIsFormOpen(false); } }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-form-title"><div className="modal-heading"><div><span className="modal-kicker">{editingLead ? "KEEP IT CURRENT" : "A NEW CONNECTION"}</span><h2 id="lead-form-title">{editingLead ? "Edit lead" : "Add a lead"}</h2><p>Save the details while the conversation is still fresh.</p></div><button className="icon-button" onClick={() => { setEditingLead(null); setFormValues(EMPTY_LEAD); setIsFormOpen(false); }} aria-label="Close form"><Icon name="close" /></button></div><form onSubmit={saveLead} className="lead-form"><div className="form-grid"><label>Full name <span>*</span><input required autoFocus value={formValues.name} onChange={(event) => setFormValues({ ...formValues, name: event.target.value })} placeholder="e.g. Alex Morgan" /></label><label>Company<input value={formValues.company} onChange={(event) => setFormValues({ ...formValues, company: event.target.value })} placeholder="Company name" /></label><label>Email <span>*</span><input required type="email" value={formValues.email} onChange={(event) => setFormValues({ ...formValues, email: event.target.value })} placeholder="alex@company.com" /></label><label>Event<input value={formValues.event} onChange={(event) => setFormValues({ ...formValues, event: event.target.value })} placeholder="Where did you meet?" /></label><label className="full-field">Follow-up status<select value={formValues.follow_up_status} onChange={(event) => setFormValues({ ...formValues, follow_up_status: event.target.value })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><label className="full-field">Conversation notes<textarea rows="4" value={formValues.notes} onChange={(event) => setFormValues({ ...formValues, notes: event.target.value })} placeholder="What did you talk about? Anything to remember for next time?" /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setEditingLead(null); setFormValues(EMPTY_LEAD); setIsFormOpen(false); }}>Cancel</button><button className="primary-button" disabled={isSaving}>{isSaving ? "Saving…" : editingLead ? "Save changes" : "Add lead"}</button></div></form></section></div>}

      {summaryLead && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSummarizing) closeSummary(); }}><section className="modal summary-modal" role="dialog" aria-modal="true" aria-labelledby="summary-title" aria-busy={isSummarizing}><div className="modal-heading"><div><span className="modal-kicker ai-kicker"><Icon name="spark" size={13} /> AI NOTE SUMMARY</span><h2 id="summary-title">Conversation summary</h2><p>For {summaryLead.name}{summaryLead.company ? ` at ${summaryLead.company}` : ""}</p></div><button className="icon-button" onClick={closeSummary} aria-label="Close summary" disabled={isSummarizing}><Icon name="close" /></button></div><div className="summary-context"><span>NOTES BEING SUMMARIZED</span><p>{summaryLead.notes?.trim() || "No notes have been added for this lead."}</p></div>{!summaryLead.notes?.trim() ? <div className="summary-empty" role="status">Add conversation notes to this lead, then choose AI Summary.</div> : isSummarizing ? <div className="summary-loading" role="status"><span className="spinner" /><div><strong>Summarizing the conversation…</strong><span>This may take a few seconds.</span></div></div> : summaryError ? <div className="summary-error" role="alert">{summaryError}</div> : summary ? <div className="summary-result" role="status"><span>AI SUMMARY</span><p>{summary}</p></div> : null}<div className="modal-actions">{summaryError && summaryLead.notes?.trim() && <button className="secondary-button" onClick={() => summarizeNotes(summaryLead)}>Try again</button>}<button className="secondary-button" onClick={closeSummary} disabled={isSummarizing}>Close</button></div></section></div>}
    </div>
  );
}

export default App;
