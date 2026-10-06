import "./LandingPage.css";

function Brand() {
  return (
    <a className="landing-brand" href="/" aria-label="Gather home">
      <span className="landing-brand-mark"><i /><i /><i /><i /></span>
      <span>gather<span className="landing-brand-dot">.</span></span>
    </a>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Brand />
        <span className="landing-header-label">EVENT LEAD MANAGER</span>
        <a className="landing-signin landing-signin-small" href="/login">Sign in</a>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <span className="landing-eyebrow"><i /> BUILT FOR EVENT RELATIONSHIPS</span>
          <h1 id="landing-title">Make every event conversation <em>count.</em></h1>
          <p>Keep the people you meet, the details you learn, and the follow-ups you owe in one thoughtful workspace.</p>
          <a className="landing-signin landing-signin-primary" href="/login">Sign in to your workspace <span aria-hidden="true">↗</span></a>
          <span className="landing-private-note">A private workspace for the Even8 team</span>
        </div>

        <div className="landing-visual" aria-hidden="true">
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="landing-note-card">
            <div className="landing-card-top"><span className="landing-card-icon">✳</span><span>YOUR WORKSPACE</span><span className="landing-card-dots">···</span></div>
            <div className="landing-card-title">Good connections<br />deserve a follow-up.</div>
            <div className="landing-card-lines"><i /><i /><i /></div>
            <div className="landing-card-footer"><span><i /> Leads &amp; notes</span><span>Follow-ups</span></div>
          </div>
          <span className="landing-spark landing-spark-one">✳</span>
          <span className="landing-spark landing-spark-two">✦</span>
        </div>
      </section>

      <section className="landing-features" aria-label="Workspace features">
        <article><span className="landing-feature-number">01</span><div><strong>Keep every detail</strong><p>Remember who you met and what matters to them.</p></div></article>
        <article><span className="landing-feature-number">02</span><div><strong>Follow through</strong><p>See who needs a thoughtful next step.</p></div></article>
        <article><span className="landing-feature-number">03</span><div><strong>Find the right words</strong><p>Turn conversation notes into a clear summary.</p></div></article>
      </section>

      <footer className="landing-footer"><Brand /><span>MADE FOR PEOPLE WHO MAKE EVENTS HAPPEN</span><span>EVEN8 <b>·</b> 2026</span></footer>
    </main>
  );
}
