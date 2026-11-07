import { useEffect, useState } from "react";
import { localToUtc, searchPlaces, searchZones, zoneLabel, formatOffset, formatUtc } from "../birth.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function BirthForm({ initial, onSave, onCancel }) {
  const [date, setDate] = useState(initial?.date || "");
  const [time, setTime] = useState(initial?.time || "12:00");
  const [unknown, setUnknown] = useState(initial?.unknownTime || false);
  const [chosen, setChosen] = useState(initial?.zone ? { place: initial.place || zoneLabel(initial.zone), zone: initial.zone } : null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState({ list: [], state: "idle" });   // idle | loading | done | offline

  // Look up the typed place after a short pause.
  useEffect(() => {
    if (chosen || query.trim().length < 2) { setFound({ list: [], state: "idle" }); return; }
    setFound((f) => ({ ...f, state: "loading" }));
    const ctl = new AbortController();
    const id = setTimeout(async () => {
      try {
        setFound({ list: await searchPlaces(query, ctl.signal), state: "done" });
      } catch (e) {
        if (e.name === "AbortError") return;
        // No internet (or the service is down): fall back to the phone's own list of time-zone cities.
        setFound({ list: searchZones(query).map((z) => ({ place: zoneLabel(z), zone: z })), state: "offline" });
      }
    }, 400);
    return () => { clearTimeout(id); ctl.abort(); };
  }, [query, chosen]);

  const ready = date && chosen && (unknown || time);
  const result = ready ? localToUtc(date, unknown ? "12:00" : time, chosen.zone) : null;
  const shortName = chosen ? chosen.place.split(",")[0] : "";

  const save = () => {
    if (!result) return;
    onSave({ date, time: unknown ? "12:00" : time, unknownTime: unknown, zone: chosen.zone, place: chosen.place, utcMs: result.utcMs, offsetMin: result.offsetMin });
  };

  return (
    <section className="birth">
      {!initial && (
        <>
          <p className="big">How far have you travelled?</p>
          <p className="small">To count how far you have travelled through space since you were born, this tab needs your birth date, time and place. It all stays on this phone.</p>
        </>
      )}
      {initial && <p className="big">Your birth details</p>}

      <label className="field">
        <span>Birth date</span>
        <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label className="field">
        <span>Birth time (local time where you were born)</span>
        <input type="time" value={unknown ? "" : time} disabled={unknown} onChange={(e) => setTime(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />
        I don't know the time (use noon, it makes almost no difference)
      </label>

      <div className="field">
        <span>Birth city or town</span>
        {chosen ? (
          <>
            <div className="chosen">
              <b>{chosen.place}</b>
              <button type="button" onClick={() => { setChosen(null); setQuery(""); }}>Change</button>
            </div>
            <p className="zoneline">Time zone: {chosen.zone.replace(/_/g, " ")}{result ? ` (${formatOffset(result.offsetMin)} on your birth date)` : ""}</p>
          </>
        ) : (
          <>
            <input type="text" placeholder="Start typing, e.g. Lisbon" value={query} autoComplete="off"
              onChange={(e) => setQuery(e.target.value)} />
            {found.state === "loading" && <p className="small">Searching…</p>}
            {found.list.map((m) => (
              <button type="button" className="match" key={m.place + m.zone} onClick={() => setChosen(m)}>{m.place}</button>
            ))}
            {found.state === "offline" && (
              <p className="small">Can't search all places right now (no internet). This is a shorter list of cities. If yours isn't here, type the nearest big city in the same time zone.</p>
            )}
            {(found.state === "done" || found.state === "offline") && found.list.length === 0 && (
              <p className="small">No match. Check the spelling, or type the nearest big city in the same time zone.</p>
            )}
          </>
        )}
      </div>

      {result && (
        <p className="preview">
          That was {unknown ? "12:00" : time} in {shortName} ({formatOffset(result.offsetMin)} on that day), which is <b>{formatUtc(result.utcMs)}</b>.
        </p>
      )}

      <div className="actions">
        <button type="button" className="primary" disabled={!result} onClick={save}>Save</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </section>
  );
}
