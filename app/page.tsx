"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  House,
  Sparkles,
  Users,
  CalendarDays,
  Bell,
  Plus,
  ArrowLeft,
  ArrowUpRight,
  MoreHorizontal,
  X,
  Beer,
  HelpCircle,
} from "lucide-react";
import {
  createMockRepository,
  dayKey,
  groupAvailability,
  isBusy,
  motiveOnDate,
  pollClosed,
  pollResults,
} from "@/lib/prototype/adapters";
import type {
  Attendance,
  Busy,
  Group,
  Plan,
  Poll,
  Snapshot,
} from "@/lib/prototype/model";
const today = () => dayKey(new Date());
const dateLabel = (date: string) =>
  date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "Date undecided";
const categories = [
  "Movie",
  "Soccer",
  "Dinner",
  "FIFA",
  "Gym",
  "Drinks",
  "Basketball",
  "Tennis",
  "Concert",
  "Games",
  "Coffee",
  "Other",
  "Custom",
];
function Artwork({
  value = "red",
  className = "",
  children,
}: {
  value?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`artwork ${className} art-${value.startsWith("data:") ? "custom" : value}`}
      style={
        value.startsWith("data:image/")
          ? { backgroundImage: `url("${value}")` }
          : undefined
      }
    >
      <span aria-hidden="true" className="art-symbol">
        ✳
      </span>
      {children}
    </div>
  );
}
function ArtPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  const [error, setError] = useState("");
  return (
    <fieldset>
      <legend>Artwork (optional)</legend>
      <div className="art-picks">
        {["red", "violet", "green", "blue"].map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`${v} graphic`}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            <Artwork value={v} />
          </button>
        ))}
      </div>
      <label>
        Custom artwork · fictional images only
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
              f.size > 2 * 1024 * 1024
            ) {
              setError("Choose a PNG, JPEG or WebP under 2 MiB");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              onChange(String(reader.result));
              setError("");
            };
            reader.onerror = () => setError("Could not read image. Try again.");
            reader.readAsDataURL(f);
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="section-heading">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Close" onClick={close}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function MotiveEditor({
  value,
  data,
  save,
  close,
}: {
  value: Plan;
  data: Snapshot;
  save: (p: Plan) => void;
  close: () => void;
}) {
  const [p, setP] = useState(value);
  const [error, setError] = useState("");
  const update = (key: keyof Plan, v: string) => setP({ ...p, [key]: v });
  return (
    <Modal
      title={
        data.plans.some((x) => x.id === p.id)
          ? "Edit Motive"
          : `Create ${p.kind}`
      }
      close={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            save({ ...p, draft: false });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <p className="fine">Synthetic only · invitations stay in this tab.</p>
        <label>
          Title
          <input
            required
            maxLength={80}
            value={p.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={categories.includes(p.category) ? p.category : "Custom"}
            onChange={(e) => update("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {(p.category === "Custom" || !categories.includes(p.category)) && (
          <label>
            Custom category
            <input
              value={p.category === "Custom" ? "" : p.category}
              onChange={(e) => update("category", e.target.value)}
            />
          </label>
        )}
        <div className="form-pair">
          <label>
            Date (optional)
            <input
              type="date"
              value={p.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </label>
          <label>
            Time (optional)
            <input
              type="time"
              value={p.time}
              onChange={(e) => update("time", e.target.value)}
            />
          </label>
        </div>
        <label>
          Location (optional)
          <input
            maxLength={100}
            value={p.place}
            onChange={(e) => update("place", e.target.value)}
          />
        </label>
        <label>
          Invite group (optional)
          <select
            value={p.groupId}
            onChange={(e) => update("groupId", e.target.value)}
          >
            <option value="">No group</option>
            {data.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Invite friends (optional · simulated)</legend>
          {data.people
            .filter((x) => x.id !== p.organizer)
            .map((x) => (
              <label className="check" key={x.id}>
                <input
                  type="checkbox"
                  checked={p.invitees.includes(x.id)}
                  onChange={(e) =>
                    setP({
                      ...p,
                      invitees: e.target.checked
                        ? [...p.invitees, x.id]
                        : p.invitees.filter((id) => id !== x.id),
                    })
                  }
                />
                {x.name}
              </label>
            ))}
        </fieldset>
        <label>
          Notes (optional)
          <textarea
            maxLength={500}
            value={p.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <ArtPicker value={p.artwork} onChange={(v) => update("artwork", v)} />
        <details>
          <summary>Advanced · recurrence</summary>
          <label>
            Repeat
            <select
              value={p.recurrence}
              onChange={(e) => update("recurrence", e.target.value)}
            >
              {["", "Weekly", "Monthly"].map((r) => (
                <option key={r} value={r}>
                  {r || "Does not repeat"}
                </option>
              ))}
            </select>
          </label>
          <p className="fine">
            Repeated calendar dates share this Motive, attendance and polls.
          </p>
        </details>
        {error && <p role="alert">{error}</p>}
        <div className="button-pair">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              try {
                save({ ...p, draft: true });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Save Draft
          </button>
          <button className="primary">
            {value.draft ? "Create & Invite" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function GroupEditor({
  value,
  data,
  save,
  close,
}: {
  value: Group;
  data: Snapshot;
  save: (g: Group) => void;
  close: () => void;
}) {
  const [g, setG] = useState(value);
  const [error, setError] = useState("");
  return (
    <Modal title="Group settings" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            save(g);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          Group name
          <input
            required
            maxLength={60}
            value={g.name}
            onChange={(e) => setG({ ...g, name: e.target.value })}
          />
        </label>
        <fieldset>
          <legend>Friends in this group</legend>
          {data.people
            .filter((p) => p.id !== g.organizer)
            .map((p) => (
              <label className="check" key={p.id}>
                <input
                  type="checkbox"
                  checked={g.members.includes(p.id)}
                  onChange={(e) =>
                    setG({
                      ...g,
                      members: e.target.checked
                        ? [...g.members, p.id]
                        : g.members.filter((id) => id !== p.id),
                    })
                  }
                />
                {p.name}
              </label>
            ))}
        </fieldset>
        <ArtPicker
          value={g.artwork}
          onChange={(artwork) => setG({ ...g, artwork })}
        />
        {error && <p role="alert">{error}</p>}
        <button className="primary">Save group</button>
      </form>
    </Modal>
  );
}
function PollEditor({
  value,
  save,
  close,
}: {
  value: Poll;
  save: (p: Poll) => void;
  close: () => void;
}) {
  const [p, setP] = useState(value);
  const [error, setError] = useState("");
  return (
    <Modal title="Poll editor" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            save(p);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          Question
          <input
            required
            maxLength={100}
            value={p.question}
            onChange={(e) => setP({ ...p, question: e.target.value })}
          />
        </label>
        <label>
          Poll type
          <select
            disabled={Object.keys(value.ballots).length > 0}
            value={p.kind}
            onChange={(e) =>
              setP({ ...p, kind: e.target.value as Poll["kind"] })
            }
          >
            {["Date", "Time", "Location", "General Choice"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={p.multiple}
            onChange={(e) => setP({ ...p, multiple: e.target.checked })}
          />
          Multiple choice
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={p.suggestions}
            onChange={(e) => setP({ ...p, suggestions: e.target.checked })}
          />
          Allow participant suggestions
        </label>
        <label>
          Deadline (optional)
          <input
            type="datetime-local"
            value={p.deadline}
            onChange={(e) => setP({ ...p, deadline: e.target.value })}
          />
        </label>
        <p className="fine">
          Changing an option label invalidates votes for that option only.
          Removing an option also removes only its votes. Affected fictional
          voters receive a local revote notice.
        </p>
        {p.options.map((o, i) => (
          <div className="option-editor" key={o.id}>
            <label>
              Option {i + 1}
              <input
                type={
                  p.kind === "Date"
                    ? "date"
                    : p.kind === "Time"
                      ? "time"
                      : "text"
                }
                required
                maxLength={100}
                value={o.label}
                onChange={(e) =>
                  setP({
                    ...p,
                    options: p.options.map((x) =>
                      x.id === o.id ? { ...o, label: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                if (confirm("Remove this option and its affected votes?"))
                  setP({
                    ...p,
                    options: p.options.filter((x) => x.id !== o.id),
                  });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setP({
              ...p,
              options: [...p.options, { id: crypto.randomUUID(), label: "" }],
            })
          }
        >
          Add option
        </button>
        {error && <p role="alert">{error}</p>}
        <button className="primary">Save poll</button>
      </form>
    </Modal>
  );
}
function BusyEditor({
  value,
  save,
  remove,
  close,
}: {
  value: Busy;
  save: (b: Busy) => void;
  remove: () => void;
  close: () => void;
}) {
  const [b, setB] = useState(value);
  const [error, setError] = useState("");
  return (
    <Modal title="Your busy time" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            save(b);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <p className="fine">
          Only you can edit your availability. Shared with your fictional groups
          in this tab.
        </p>
        <div className="form-pair">
          <label>
            From
            <input
              required
              type="date"
              value={b.date}
              onChange={(e) =>
                setB({
                  ...b,
                  date: e.target.value,
                  endDate:
                    e.target.value > b.endDate ? e.target.value : b.endDate,
                })
              }
            />
          </label>
          <label>
            Through
            <input
              required
              min={b.date}
              type="date"
              value={b.endDate}
              onChange={(e) => setB({ ...b, endDate: e.target.value })}
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={!b.start}
            onChange={(e) =>
              setB({
                ...b,
                start: e.target.checked ? "" : "09:00",
                end: e.target.checked ? "" : "17:00",
              })
            }
          />
          Full day
        </label>
        {b.start && (
          <div className="form-pair">
            <label>
              Start
              <input
                required
                type="time"
                value={b.start}
                onChange={(e) => setB({ ...b, start: e.target.value })}
              />
            </label>
            <label>
              End
              <input
                required
                type="time"
                value={b.end}
                onChange={(e) => setB({ ...b, end: e.target.value })}
              />
            </label>
          </div>
        )}
        <label>
          Repeat
          <select
            value={b.recurrence}
            onChange={(e) =>
              setB({ ...b, recurrence: e.target.value as Busy["recurrence"] })
            }
          >
            <option>None</option>
            <option>Weekly</option>
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="primary">Save busy time</button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (confirm("Remove this busy time?")) remove();
          }}
        >
          Remove busy time
        </button>
      </form>
    </Modal>
  );
}
function Month({
  data,
  actor,
  groupId,
  date,
  setDate,
  openBreakdown,
}: {
  data: Snapshot;
  actor: string;
  groupId?: string;
  date: string;
  setDate: (s: string) => void;
  openBreakdown?: (d: string) => void;
}) {
  const [month, setMonth] = useState(
    () => new Date(`${date || today()}T12:00:00`),
  );
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const days = Array.from(
    {
      length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`,
  );
  const stats = (d: string) =>
    groupId
      ? groupAvailability(data, groupId, d, actor).filter((p) => p.busy.length)
          .length
      : data.busy.filter((b) => b.person === actor && isBusy(b, d)).length;
  const ranked = days.map((d) => ({ d, count: stats(d) }));
  const best = [...ranked].sort((a, b) => a.count - b.count)[0];
  const worst = [...ranked].sort((a, b) => b.count - a.count)[0];
  return (
    <>
      <section className="panel calendar">
        <div className="section-heading">
          <button
            aria-label="Previous month"
            className="icon-button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            ‹
          </button>
          <h2>
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </h2>
          <button
            aria-label="Next month"
            className="icon-button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            ›
          </button>
        </div>
        <div className="calendar-grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <small key={i}>{d}</small>
          ))}
          {Array.from(
            {
              length: new Date(
                month.getFullYear(),
                month.getMonth(),
                1,
              ).getDay(),
            },
            (_, i) => (
              <span key={i} />
            ),
          )}
          {days.map((d) => (
            <button
              key={d}
              aria-pressed={date === d}
              aria-label={`${dateLabel(d)}, ${stats(d) ? "reported busy" : "no reported busy time"}`}
              className={`${date === d ? "chosen" : ""} ${stats(d) ? "busy-day" : "open-day"}`}
              onClick={() => setDate(d)}
            >
              {Number(d.slice(-2))}
              {data.plans.some(
                (p) =>
                  motiveOnDate(p, d) && (!groupId || p.groupId === groupId),
              ) && <i />}
            </button>
          ))}
        </div>
        <p className="fine">
          Green: no reported busy time · muted red: reported busy · dot: Motive.
          Unknown does not mean guaranteed free.
        </p>
      </section>
      {groupId && (
        <div className="button-pair">
          <button className="panel" onClick={() => openBreakdown?.(best.d)}>
            <strong>Best Days</strong>
            <span>
              {dateLabel(best.d)} · {best.count} busy
            </span>
          </button>
          <button className="panel" onClick={() => openBreakdown?.(worst.d)}>
            <strong>Most Busy</strong>
            <span>
              {dateLabel(worst.d)} · {worst.count} busy
            </span>
          </button>
        </div>
      )}
    </>
  );
}
export default function Motive() {
  const [repo] = useState(createMockRepository);
  const [data, setData] = useState(() => repo.snapshot());
  const [active, setActive] = useState(false);
  const [actor, setActor] = useState("alex");
  const [tab, setTab] = useState("Home");
  const [selected, setSelected] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState("Details");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupTab, setGroupTab] = useState("Motives");
  const [pollId, setPollId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("List");
  const [notice, setNotice] = useState("");
  const [choice, setChoice] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editPoll, setEditPoll] = useState<Poll | null>(null);
  const [editBusy, setEditBusy] = useState<Busy | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const scroll = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  const run = (fn: () => Snapshot) => {
    try {
      setData(fn());
      setNotice("Updated in this tab only.");
      return true;
    } catch (e) {
      setNotice((e as Error).message);
      return false;
    }
  };
  const person = data.people.find((p) => p.id === actor)!;
  const motive = data.plans.find((p) => p.id === selected);
  const g = data.groups.find((g) => g.id === groupId);
  const poll = data.polls.find((p) => p.id === pollId);
  const ordered = [...data.plans].sort((a, b) =>
    (a.date || "9999").localeCompare(b.date || "9999"),
  );
  const live = ordered.filter((p) => !p.draft && p.status !== "Cancelled");
  const next = live.find((p) => p.date >= today()) ?? live[0];
  const open = (p: Plan, t = "Details") => {
    scroll.current = window.scrollY;
    setSelected(p.id);
    setDetailTab(t);
    setPollId(null);
    window.scrollTo(0, 0);
  };
  const back = () => {
    if (pollId) {
      setPollId(null);
      return;
    }
    if (breakdown) {
      setBreakdown(null);
      return;
    }
    if (selected) {
      setSelected(null);
      requestAnimationFrame(() => window.scrollTo(0, scroll.current));
      return;
    }
    setGroupId(null);
  };
  const navigate = (t: string) => {
    setTab(t);
    setSelected(null);
    setGroupId(null);
    setPollId(null);
    setBreakdown(null);
    setNotice("");
    window.scrollTo(0, 0);
  };
  const newMotive = (kind: "Motive" | "Event") => {
    setChoice(false);
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      groupId: groupId ?? "",
      date: "",
      time: "",
      place: "",
      description: "",
      attendance: "No Response",
      votes: [0, 0],
      vote: null,
      organizer: actor,
      invitees: [],
      responses: {},
      status: "Planning",
      draft: true,
      category: "Other",
      recurrence: "",
      artwork: "red",
      kind,
    });
  };
  const newPoll = () =>
    setEditPoll({
      id: crypto.randomUUID(),
      planId: motive!.id,
      creator: actor,
      question: "",
      kind: "General Choice",
      multiple: false,
      suggestions: false,
      deadline: "",
      closed: false,
      options: [
        { id: crypto.randomUUID(), label: "" },
        { id: crypto.randomUUID(), label: "" },
      ],
      ballots: {},
      outcome: null,
    });
  const row = (p: Plan) => (
    <button className="motive-row" key={p.id} onClick={() => open(p)}>
      <Artwork value={p.artwork} />
      <span className="row-copy">
        <small>
          {dateLabel(p.date)} · {p.time || "Time undecided"}
        </small>
        <strong>{p.title}</strong>
        <span>
          {data.groups.find((g) => g.id === p.groupId)?.name || "Friends"} ·{" "}
          {p.responses[actor] ?? "No Response"}
        </span>
        <span
          className={`status ${p.status === "Cancelled" ? "cancelled" : ""}`}
        >
          {p.draft ? "Private draft" : p.status}
          {p.recurrence ? ` · ${p.recurrence}` : ""}
        </span>
      </span>
      <ArrowUpRight size={18} />
    </button>
  );
  const list = (values: Plan[]) =>
    values.length ? (
      values.map(row)
    ) : (
      <p className="empty">No Motives here yet.</p>
    );
  const busyMine = data.busy.filter(
    (b) => b.person === actor && isBusy(b, date),
  );
  if (!active)
    return (
      <main className="entry">
        <div className="wordmark">
          M
          <span className="brand-o">
            O<b>✦</b>
          </span>
          TIVE
        </div>
        <Artwork className="entry-graphic">
          <h1>Owner preview</h1>
        </Artwork>
        <p className="eyebrow">OWNER-ONLY UI PROTOTYPE</p>
        <p>
          Explore fictional Motives, polls and calendars. Everything stays in
          this tab and resets on reload. No real accounts, invitations or
          messages.
        </p>
        <button className="primary" onClick={() => setActive(true)}>
          Explore as Alex <ArrowUpRight size={18} />
        </button>
      </main>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="wordmark"
          aria-label="MOTIVE Home"
          onClick={() => navigate("Home")}
        >
          M
          <span className="brand-o">
            O<b>✦</b>
          </span>
          TIVE
        </button>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Notifications"
            onClick={() => navigate("Notifications")}
          >
            <Bell size={21} />
            {data.notifications.some((n) => !n.read) && (
              <i className="unread" />
            )}
          </button>
          <button
            className="avatar"
            aria-label="Profile"
            onClick={() => navigate("Profile")}
          >
            {person.avatar}
          </button>
        </div>
      </header>
      <p className="demo-banner">SYNTHETIC · {person.name} · This tab only</p>
      <main id="main-content">
        {notice && (
          <p className="notice" role="status">
            {notice}
            <button
              className="icon-button"
              aria-label="Dismiss notice"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </p>
        )}
        {(selected || groupId || breakdown) && (
          <button className="back" onClick={back}>
            <ArrowLeft size={17} />
            Back
          </button>
        )}
        {breakdown && g ? (
          <>
            <h1>Availability</h1>
            <h2>{dateLabel(breakdown)}</h2>
            <p className="fine">
              Read-only · {g.name} · based on reported availability
            </p>
            {groupAvailability(data, g.id, breakdown, actor).map((x) => (
              <article className="panel" key={x.person.id}>
                <strong>{x.person.name}</strong>
                <p>
                  {x.busy.length
                    ? x.busy
                        .map((b) =>
                          b.start ? `${b.start}–${b.end}` : "Full day busy",
                        )
                        .join(", ")
                    : x.reported
                      ? "No busy time reported for this day"
                      : "Unknown · no availability reported"}
                </p>
              </article>
            ))}
          </>
        ) : poll && motive ? (
          (() => {
            const results = pollResults(poll),
              closed = pollClosed(poll, clock),
              choices = poll.ballots[actor] ?? [];
            const tied =
              results.votes > 0 &&
              results.counts.filter((c) => c === Math.max(...results.counts))
                .length > 1;
            return (
              <>
                <p className="eyebrow">
                  {motive.title} · {poll.kind}
                </p>
                <h1>{poll.question}</h1>
                <p>
                  {closed
                    ? "Closed · results"
                    : poll.multiple
                      ? "Choose any options"
                      : "Choose one option"}
                  {poll.deadline
                    ? ` · Deadline ${new Date(poll.deadline).toLocaleString()}`
                    : ""}
                </p>
                <p className="fine">
                  {results.votes} votes · {results.voters} unique voters
                  {tied ? " · Tied — no automatic winner" : ""}
                </p>
                {poll.options.map((o, i) => (
                  <div key={o.id}>
                    <button
                      className="poll-option"
                      aria-pressed={choices.includes(o.id)}
                      disabled={closed || motive.status === "Cancelled"}
                      onClick={() =>
                        run(() =>
                          repo.cast(
                            poll.id,
                            poll.multiple
                              ? choices.includes(o.id)
                                ? choices.filter((id) => id !== o.id)
                                : [...choices, o.id]
                              : choices.includes(o.id)
                                ? []
                                : [o.id],
                          ),
                        )
                      }
                    >
                      <span>
                        {choices.includes(o.id) ? "✓ " : ""}
                        {o.label}
                      </span>
                      <strong>{results.counts[i]} votes</strong>
                      <span
                        className="poll-bar"
                        style={{
                          width: `${(100 * results.counts[i]) / Math.max(1, results.voters)}%`,
                        }}
                      />
                    </button>
                    {poll.kind === "Date" &&
                      data.busy.some(
                        (b) => b.person === actor && isBusy(b, o.label),
                      ) && (
                        <p className="fine">
                          You reported busy time. You can still vote.
                        </p>
                      )}
                  </div>
                ))}
                {poll.outcome && (
                  <p className="notice">
                    Applied outcome:{" "}
                    {poll.options.find((o) => o.id === poll.outcome)?.label}
                  </p>
                )}
                {poll.suggestions &&
                  !closed &&
                  motive.status !== "Cancelled" && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        if (
                          run(() =>
                            repo.suggest(poll.id, String(f.get("suggestion"))),
                          )
                        )
                          e.currentTarget.reset();
                      }}
                    >
                      <label>
                        Suggest an option
                        <input
                          name="suggestion"
                          required
                          type={
                            poll.kind === "Date"
                              ? "date"
                              : poll.kind === "Time"
                                ? "time"
                                : "text"
                          }
                        />
                      </label>
                      <button className="secondary">Add suggestion</button>
                    </form>
                  )}
                {poll.creator === actor && motive.status !== "Cancelled" && (
                  <details className="panel">
                    <summary>Creator controls</summary>
                    <button
                      className="secondary"
                      onClick={() => setEditPoll(poll)}
                    >
                      Edit options
                    </button>
                    {!closed && (
                      <button
                        className="secondary"
                        onClick={() => {
                          if (
                            confirm(
                              "Close voting? Results will remain visible.",
                            )
                          )
                            run(() => repo.closePoll(poll.id));
                        }}
                      >
                        Close poll
                      </button>
                    )}
                    {closed && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          if (confirm("Apply this outcome to the Motive?"))
                            run(() =>
                              repo.applyOutcome(
                                poll.id,
                                String(f.get("outcome")),
                              ),
                            );
                        }}
                      >
                        <label>
                          Choose the final outcome
                          <select required name="outcome" defaultValue="">
                            <option value="" disabled>
                              Choose explicitly
                            </option>
                            {poll.options.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button className="primary">
                          Finalize & apply outcome
                        </button>
                      </form>
                    )}
                  </details>
                )}
              </>
            );
          })()
        ) : motive ? (
          <>
            <Artwork value={motive.artwork} className="detail-art">
              <span className="art-caption">
                {motive.category === "Drinks" && <Beer size={18} />}{" "}
                {motive.category}
              </span>
            </Artwork>
            <div className="section-heading">
              <h1>{motive.title}</h1>
              {motive.organizer === actor && (
                <details className="overflow">
                  <summary aria-label="Organizer actions">
                    <MoreHorizontal />
                  </summary>
                  <button onClick={() => setEditing(motive)}>
                    Edit Motive
                  </button>
                  {!motive.draft && motive.status !== "Cancelled" && (
                    <>
                      <button
                        onClick={() =>
                          run(() =>
                            repo.savePlan({
                              ...motive,
                              status:
                                motive.status === "Confirmed"
                                  ? "Planning"
                                  : "Confirmed",
                            }),
                          )
                        }
                      >
                        {motive.status === "Confirmed"
                          ? "Return to Planning"
                          : "Confirm Motive"}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Cancel this Motive? It will remain visible.",
                            )
                          )
                            run(() =>
                              repo.savePlan({ ...motive, status: "Cancelled" }),
                            );
                        }}
                      >
                        Cancel Motive
                      </button>
                    </>
                  )}
                </details>
              )}
            </div>
            <p
              className={`status ${motive.status === "Cancelled" ? "cancelled" : ""}`}
            >
              {motive.draft ? "Private draft" : motive.status}
            </p>
            <div className="segmented">
              {["Details", "Polls", "Attendance"].map((t) => (
                <button
                  key={t}
                  aria-pressed={detailTab === t}
                  onClick={() => setDetailTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {detailTab === "Details" ? (
              <section className="panel">
                <p>
                  {dateLabel(motive.date)} · {motive.time || "Time undecided"}
                </p>
                <p>{motive.place || "Location undecided"}</p>
                <p>{motive.description || "No notes added."}</p>
                <p className="fine">
                  {g?.name ||
                    data.groups.find((g) => g.id === motive.groupId)?.name ||
                    "Friends"}{" "}
                  · Organizer:{" "}
                  {data.people.find((p) => p.id === motive.organizer)?.name}
                  {motive.recurrence ? ` · ${motive.recurrence}` : ""}
                </p>
              </section>
            ) : detailTab === "Polls" ? (
              <>
                <div className="section-heading">
                  <h2>Polls</h2>
                  {motive.organizer === actor &&
                    !motive.draft &&
                    motive.status !== "Cancelled" && (
                      <button className="text-button" onClick={newPoll}>
                        Create poll +
                      </button>
                    )}
                </div>
                {!data.polls.some((p) => p.planId === motive.id) && (
                  <p className="empty">No polls yet.</p>
                )}
                {data.polls
                  .filter((p) => p.planId === motive.id)
                  .map((p) => (
                    <button
                      className="panel poll-summary"
                      key={p.id}
                      onClick={() => {
                        setPollId(p.id);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <span>
                        <strong>{p.question}</strong>
                        <small>
                          {pollClosed(p, clock) ? "Closed" : "Open"} ·{" "}
                          {pollResults(p).votes} votes · {pollResults(p).voters}{" "}
                          voters
                        </small>
                      </span>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
              </>
            ) : (
              <>
                <h2>Your attendance</h2>
                <div className="segmented">
                  {(["Going", "Can't Go", "No Response"] as Attendance[]).map(
                    (a) => (
                      <button
                        key={a}
                        aria-pressed={
                          (motive.responses[actor] ?? "No Response") === a
                        }
                        disabled={motive.status === "Cancelled" || motive.draft}
                        onClick={() => run(() => repo.attend(motive.id, a))}
                      >
                        {a}
                      </button>
                    ),
                  )}
                </div>
                {data.busy.some(
                  (b) => b.person === actor && isBusy(b, motive.date),
                ) && (
                  <p className="fine">
                    You reported busy time. Attendance is your choice.
                  </p>
                )}
                {(["Going", "Can't Go", "No Response"] as Attendance[]).map(
                  (a) => (
                    <section className="panel" key={a}>
                      <h2>{a}</h2>
                      {motive.invitees
                        .filter(
                          (id) => (motive.responses[id] ?? "No Response") === a,
                        )
                        .map((id) => (
                          <p key={id}>
                            {data.people.find((p) => p.id === id)?.name}
                          </p>
                        ))}
                    </section>
                  ),
                )}
              </>
            )}
          </>
        ) : (
          <>
            {tab === "Home" && (
              <>
                <div className="section-heading">
                  <h1>What’s the move?</h1>
                  <button
                    className="help-dot"
                    aria-label="About this prototype"
                    onClick={() =>
                      setNotice(
                        "Synthetic people and local state only. Reload resets everything. No external invitations or notifications.",
                      )
                    }
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
                <h2>Next Up</h2>
                {next ? (
                  <button className="hero-button" onClick={() => open(next)}>
                    <Artwork value={next.artwork} className="hero">
                      <span className="hero-top">
                        {data.groups.find((g) => g.id === next.groupId)?.name ||
                          "Friends"}
                        <ArrowUpRight />
                      </span>
                      <span className="hero-bottom">
                        <small>
                          {dateLabel(next.date)} ·{" "}
                          {next.time || "Time undecided"}
                        </small>
                        <strong>{next.title}</strong>
                        <span>{next.place || "Location undecided"}</span>
                        <span className="participation">
                          ● ● ●{" "}
                          <small>
                            {next.responses[actor] ?? "No Response"} ·{" "}
                            {next.status}
                          </small>
                        </span>
                      </span>
                    </Artwork>
                  </button>
                ) : (
                  <p className="empty">Your next Motive starts here.</p>
                )}
                {(live.some(
                  (p) =>
                    (p.responses[actor] ?? "No Response") === "No Response",
                ) ||
                  data.polls.some(
                    (p) =>
                      !pollClosed(p, clock) &&
                      !p.ballots[actor]?.length &&
                      live.some((m) => m.id === p.planId),
                  )) && (
                  <section>
                    <h2>Needs You</h2>
                    <div className="needs-grid">
                      {data.polls
                        .filter(
                          (p) =>
                            !pollClosed(p, clock) &&
                            !p.ballots[actor]?.length &&
                            live.some((m) => m.id === p.planId),
                        )
                        .map((p) => (
                          <button
                            className="panel"
                            key={p.id}
                            onClick={() => {
                              open(
                                data.plans.find((m) => m.id === p.planId)!,
                                "Polls",
                              );
                              setPollId(p.id);
                            }}
                          >
                            <Sparkles className="red" size={20} />
                            <strong>{p.question}</strong>
                            <small>Vote in poll ↗</small>
                          </button>
                        ))}
                      {live
                        .filter(
                          (p) =>
                            (p.responses[actor] ?? "No Response") ===
                            "No Response",
                        )
                        .map((p) => (
                          <button
                            className="panel"
                            key={p.id}
                            onClick={() => open(p, "Attendance")}
                          >
                            <Users className="red" size={20} />
                            <strong>{p.title}</strong>
                            <small>Respond to attendance ↗</small>
                          </button>
                        ))}
                    </div>
                  </section>
                )}
                <div className="section-heading">
                  <h2>Coming Up</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("Motives")}
                  >
                    All Motives ↗
                  </button>
                </div>
                {list(live.filter((p) => p.id !== next?.id).slice(0, 3))}
              </>
            )}
            {tab === "Motives" && (
              <>
                <h1>Motives</h1>
                <div className="segmented">
                  {["List", "Calendar"].map((t) => (
                    <button
                      key={t}
                      aria-pressed={view === t}
                      onClick={() => setView(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="filter-row">
                  {["All", "Confirmed", "Planning", "Recurring", "Drafts"].map(
                    (t) => (
                      <button
                        key={t}
                        aria-pressed={filter === t}
                        onClick={() => setFilter(t)}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
                {view === "Calendar" && (
                  <Month
                    data={{
                      ...data,
                      plans: data.plans.filter((p) =>
                        filter === "All" || filter === "Drafts"
                          ? filter === "All" || p.draft
                          : filter === "Recurring"
                            ? !!p.recurrence
                            : p.status === filter,
                      ),
                    }}
                    actor={actor}
                    date={date}
                    setDate={setDate}
                  />
                )}{" "}
                {(() => {
                  const values = ordered.filter(
                    (p) =>
                      (filter === "Drafts"
                        ? p.draft
                        : !p.draft &&
                          (filter === "All" ||
                            (filter === "Recurring" && !!p.recurrence) ||
                            p.status === filter)) &&
                      (view !== "Calendar" || motiveOnDate(p, date)),
                  );
                  if (view === "Calendar") return list(values);
                  const start = new Date(`${today()}T12:00:00`);
                  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
                  const nextWeek = new Date(start);
                  nextWeek.setDate(start.getDate() + 7);
                  const later = new Date(start);
                  later.setDate(start.getDate() + 14);
                  return ["This Week", "Next Week", "Later"].map((label, i) => {
                    const rows = values.filter((p) =>
                      i === 0
                        ? !!p.date && p.date < dayKey(nextWeek)
                        : i === 1
                          ? !!p.date &&
                            p.date >= dayKey(nextWeek) &&
                            p.date < dayKey(later)
                          : !p.date || p.date >= dayKey(later),
                    );
                    return (
                      <section key={label}>
                        <h2>{label}</h2>
                        {list(rows)}
                      </section>
                    );
                  });
                })()}
              </>
            )}
            {tab === "Groups" &&
              (g ? (
                <>
                  <Artwork value={g.artwork} className="group-art" />
                  <div className="section-heading">
                    <h1>{g.name}</h1>
                    {g.organizer === actor && (
                      <button
                        className="text-button"
                        onClick={() => setEditGroup(g)}
                      >
                        Manage group
                      </button>
                    )}
                  </div>
                  <div className="segmented">
                    {["Motives", "Calendar", "Members"].map((t) => (
                      <button
                        key={t}
                        aria-pressed={groupTab === t}
                        onClick={() => setGroupTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {groupTab === "Motives" ? (
                    list(ordered.filter((p) => p.groupId === g.id && !p.draft))
                  ) : groupTab === "Members" ? (
                    g.members.map((id) => (
                      <article className="panel member" key={id}>
                        <span className="avatar">
                          {data.people.find((p) => p.id === id)?.avatar}
                        </span>
                        <strong>
                          {data.people.find((p) => p.id === id)?.name}
                        </strong>
                        <small>
                          {g.organizer === id ? "Organizer" : "Member"}
                        </small>
                      </article>
                    ))
                  ) : (
                    <>
                      <Month
                        data={data}
                        actor={actor}
                        groupId={g.id}
                        date={date}
                        setDate={setDate}
                        openBreakdown={setBreakdown}
                      />
                      <button
                        className="panel full-width"
                        onClick={() => setBreakdown(date)}
                      >
                        <strong>{dateLabel(date)}</strong>
                        <span>
                          {
                            groupAvailability(data, g.id, date, actor).filter(
                              (p) => p.busy.length,
                            ).length
                          }{" "}
                          members reported busy · View breakdown ↗
                        </span>
                      </button>
                      {list(
                        ordered.filter(
                          (p) =>
                            p.groupId === g.id &&
                            motiveOnDate(p, date) &&
                            !p.draft,
                        ),
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="section-heading">
                    <h1>Groups</h1>
                    <button
                      className="text-button"
                      onClick={() =>
                        setEditGroup({
                          id: crypto.randomUUID(),
                          name: "",
                          emoji: "✳",
                          members: [actor],
                          description: "",
                          organizer: actor,
                          artwork: "red",
                        })
                      }
                    >
                      Create group +
                    </button>
                  </div>
                  {data.groups.length ? (
                    data.groups.map((g) => (
                      <button
                        className="group-card panel"
                        key={g.id}
                        onClick={() => {
                          setGroupId(g.id);
                          setGroupTab("Motives");
                        }}
                      >
                        <Artwork value={g.artwork} />
                        <span>
                          <strong>{g.name}</strong>
                          <small>{g.members.length} members · Private</small>
                        </span>
                        <ArrowUpRight size={18} />
                      </button>
                    ))
                  ) : (
                    <p className="empty">
                      No groups yet. Create one with fictional friends.
                    </p>
                  )}
                </>
              ))}
            {tab === "Calendar" && (
              <>
                <h1>Your calendar</h1>
                <Month
                  data={data}
                  actor={actor}
                  date={date}
                  setDate={setDate}
                />
                <div className="section-heading">
                  <h2>{dateLabel(date)}</h2>
                  <button
                    className="text-button"
                    onClick={() =>
                      setEditBusy({
                        id: crypto.randomUUID(),
                        person: actor,
                        date,
                        endDate: date,
                        start: "",
                        end: "",
                        recurrence: "None",
                      })
                    }
                  >
                    Mark Busy +
                  </button>
                </div>
                {busyMine.map((b) => (
                  <button
                    className="panel full-width"
                    key={b.id}
                    onClick={() => setEditBusy(b)}
                  >
                    <strong>
                      Busy · {b.start ? `${b.start}–${b.end}` : "Full day"}
                    </strong>
                    <small>{b.recurrence} · Edit / remove</small>
                  </button>
                ))}
                {!busyMine.length && (
                  <p className="fine">No busy time reported for this day.</p>
                )}
                {list(ordered.filter((p) => !p.draft && motiveOnDate(p, date)))}
              </>
            )}
            {tab === "Notifications" && (
              <>
                <h1>Notifications</h1>
                <p className="fine">
                  Local simulated notices only. No notification delivery or
                  browser permission is enabled.
                </p>
                {data.notifications.length ? (
                  [...data.notifications]
                    .sort((a, b) => b.at - a.at)
                    .map((n) => (
                      <button
                        className={`panel full-width ${!n.read ? "unread-notice" : ""}`}
                        key={n.id}
                        onClick={() => {
                          run(() => repo.readNotice(n.id));
                          const p = data.plans.find((p) => p.id === n.planId);
                          if (p) {
                            open(p, n.pollId ? "Polls" : "Details");
                            setPollId(n.pollId ?? null);
                          }
                        }}
                      >
                        <strong>
                          {n.read ? "" : "● "}
                          {n.text}
                        </strong>
                        <small>{new Date(n.at).toLocaleString()}</small>
                      </button>
                    ))
                ) : (
                  <p className="empty">You’re all caught up.</p>
                )}
              </>
            )}
            {tab === "Profile" && (
              <>
                <div className="profile-heading">
                  <span className="avatar">{person.avatar}</span>
                  <h1>{person.name}</h1>
                </div>
                <form
                  className="panel"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(() =>
                      repo.profile({
                        name: String(f.get("name")),
                        avatar: String(f.get("avatar")),
                      }),
                    );
                  }}
                  key={actor}
                >
                  <label>
                    Display name
                    <input
                      name="name"
                      required
                      maxLength={30}
                      defaultValue={person.name}
                    />
                  </label>
                  <label>
                    Avatar
                    <select name="avatar" defaultValue={person.avatar}>
                      {["A", "S", "J", "R", "✳", "◒"].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <button className="primary">Save profile</button>
                </form>
                <h2>Friends</h2>
                {data.friends.map((id) => (
                  <article className="panel member" key={id}>
                    <span className="avatar">
                      {data.people.find((p) => p.id === id)?.avatar}
                    </span>
                    <strong>
                      {data.people.find((p) => p.id === id)?.name}
                    </strong>
                  </article>
                ))}
                <h2>Friend requests</h2>
                {data.requests.length ? (
                  data.requests.map((id) => (
                    <article className="panel" key={id}>
                      <strong>
                        {data.people.find((p) => p.id === id)?.name}
                      </strong>
                      <div className="button-pair">
                        <button
                          className="secondary"
                          disabled={actor !== "alex"}
                          onClick={() => run(() => repo.friend(id, true))}
                        >
                          Accept
                        </button>
                        <button
                          className="secondary"
                          disabled={actor !== "alex"}
                          onClick={() => run(() => repo.friend(id, false))}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty">No pending requests.</p>
                )}
                <details className="panel">
                  <summary>Prototype settings</summary>
                  <label>
                    View as fictional member
                    <select
                      value={actor}
                      onChange={(e) => {
                        repo.setActor(e.target.value);
                        setActor(e.target.value);
                        setData(repo.snapshot());
                        setNotice(
                          "Switched fictional member. This is not authentication.",
                        );
                      }}
                    >
                      {data.people.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="fine">
                    Fictional usernames are unique fixtures. All profiles are
                    private; no directory or account registration. Friendship
                    changes are an Alex-only demonstration.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      if (confirm("Reset all synthetic data?")) {
                        setData(repo.reset());
                        setActor("alex");
                      }
                    }}
                  >
                    Reset sample data
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setData(repo.reset());
                      setActor("alex");
                      setActive(false);
                      navigate("Home");
                    }}
                  >
                    End synthetic session
                  </button>
                </details>
              </>
            )}
          </>
        )}
      </main>
      {!selected &&
        !breakdown &&
        ["Home", "Motives", "Groups", "Calendar"].includes(tab) && (
          <button
            className="fab"
            aria-label="Create Motive or Event"
            onClick={() => setChoice(true)}
          >
            <Plus />
          </button>
        )}
      <nav className="bottom-nav" aria-label="Main navigation">
        {[
          { name: "Home", icon: House },
          { name: "Motives", icon: Sparkles },
          { name: "Groups", icon: Users },
          { name: "Calendar", icon: CalendarDays },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            aria-current={tab === name ? "page" : undefined}
            onClick={() => navigate(name)}
          >
            <Icon size={22} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {choice && (
        <Modal title="What are you creating?" close={() => setChoice(false)}>
          <p className="fine">Both are synthetic and begin in Planning.</p>
          <div className="button-pair">
            <button className="panel" onClick={() => newMotive("Motive")}>
              <Sparkles />
              <strong>Motive</strong>
            </button>
            <button className="panel" onClick={() => newMotive("Event")}>
              <CalendarDays />
              <strong>Event</strong>
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <MotiveEditor
          value={editing}
          data={data}
          close={() => setEditing(null)}
          save={(p) => {
            const result = repo.savePlan(p);
            setData(result);
            setEditing(null);
            setSelected(p.id);
            setDetailTab("Details");
            setNotice(
              p.draft
                ? "Private draft saved in this tab."
                : "Saved locally. Invitations are simulated; nobody is contacted.",
            );
          }}
        />
      )}
      {editGroup && (
        <GroupEditor
          value={editGroup}
          data={data}
          close={() => setEditGroup(null)}
          save={(g) => {
            setData(repo.saveGroup(g));
            setEditGroup(null);
            setGroupId(g.id);
            setGroupTab("Members");
            setTab("Groups");
          }}
        />
      )}
      {editPoll && (
        <PollEditor
          value={editPoll}
          close={() => setEditPoll(null)}
          save={(p) => {
            const old = data.polls.find((x) => x.id === p.id);
            if (
              old &&
              Object.keys(old.ballots).length &&
              !confirm(
                "Save option changes? Affected votes will be invalidated and local revote notices generated.",
              )
            )
              return;
            setData(repo.savePoll(p));
            setEditPoll(null);
            setPollId(p.id);
          }}
        />
      )}
      {editBusy && (
        <BusyEditor
          value={editBusy}
          close={() => setEditBusy(null)}
          save={(b) => {
            setData(repo.saveBusy(b));
            setEditBusy(null);
          }}
          remove={() => {
            if (data.busy.some((b) => b.id === editBusy.id))
              run(() => repo.removeBusy(editBusy.id));
            setEditBusy(null);
          }}
        />
      )}
    </div>
  );
}
