import { LINK_GROUPS } from "../links.js";

export default function Links() {
  return (
    <section className="links">
      {LINK_GROUPS.map((g) => (
        <div key={g.title}>
          <p className="label">{g.title}</p>
          {g.links.map((l) => (
            <a key={l.url} className="link" href={l.url} target="_blank" rel="noopener noreferrer">
              <span><b>{l.label}</b><small>{l.note}</small></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      ))}
      <p className="small">These open in your browser and need an internet connection.</p>
    </section>
  );
}
