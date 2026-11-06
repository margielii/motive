"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Plus,
  House,
  CalendarDays,
  Users,
  Compass,
  Bell,
  ArrowLeft,
  Check,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  createMockRepository,
  createSyntheticIdentity,
} from "@/lib/prototype/adapters";
import type { Plan, Attendance } from "@/lib/prototype/model";

type Tab = "Home" | "Plans" | "Groups" | "Calendar" | "Profile" | "Activity";
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
export default function Motive() {
  const [repository] = useState(createMockRepository);
  const [identity] = useState(createSyntheticIdentity);
  const [data, setData] = useState(() => repository.snapshot());
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState<Tab>("Home");
  const [selected, setSelected] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [day, setDay] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const plan = data.plans.find((p) => p.id === selected);
  const ordered = [...data.plans].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
  );
  const next =
    ordered.find((p) => new Date(`${p.date}T${p.time}`) >= new Date()) ??
    ordered[0];
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (editing) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [editing]);
  const navigate = (value: Tab) => {
    setTab(value);
    setSelected(null);
    setGroup(null);
    setNotice("");
  };
  const changed = () =>
    setNotice(
      "Updated in this synthetic session only. Reload resets all changes.",
    );
  function newPlan() {
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      groupId: group ?? data.groups[0].id,
      date: day || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
      time: "19:00",
      place: "",
      description: "",
      attendance: "Going",
      votes: [0, 0],
      vote: null,
    });
  }
  const row = (p: Plan) => (
    <button className="plan-row" key={p.id} onClick={() => setSelected(p.id)}>
      <span className={`plan-art art-${p.groupId}`} aria-hidden="true">
        {data.groups.find((g) => g.id === p.groupId)?.emoji}
      </span>
      <span className="row-copy">
        <small>
          {dateLabel(p.date)} · {p.time}
        </small>
        <strong>{p.title}</strong>
        <span>{data.groups.find((g) => g.id === p.groupId)?.name}</span>
      </span>
      <ArrowUpRight size={19} />
    </button>
  );
  if (!active)
    return (
      <main className="entry">
        <div className="wordmark">
          MOTIVE<span>®</span>
        </div>
        <div className="entry-art" aria-hidden="true">
          <span>
            Make time
            <br />
            for your people.
          </span>
        </div>
        <p className="eyebrow">OWNER STAGING · SYNTHETIC PROTOTYPE</p>
        <h1>
          Good plans.
          <br />
          Better company.
        </h1>
        <p>
          Explore MOTIVE as Alex, a fictional member. All people, plans and
          activity are synthetic. Changes live only in this tab and reset on
          reload.
        </p>
        <button
          className="primary"
          onClick={() => {
            identity.startSyntheticSession();
            setActive(!!identity.current());
          }}
        >
          Start synthetic session <ArrowUpRight size={18} />
        </button>
        <p className="fine">
          No real account sign-in or registration is available. Do not enter
          real personal information. Hosting access stays owner-only.
        </p>
      </main>
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="wordmark"
          onClick={() => navigate("Home")}
          aria-label="MOTIVE Home"
        >
          MOTIVE<span>®</span>
        </button>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Activity"
            onClick={() => navigate("Activity")}
          >
            <Bell size={21} />
            <i />
          </button>
          <button
            className="avatar"
            aria-label="Profile"
            onClick={() => navigate("Profile")}
          >
            {data.profile.avatar}
          </button>
        </div>
      </header>
      <div className="demo-banner">
        SYNTHETIC DEMO <span>· This tab only · No shared writes</span>
      </div>
      <main id="main-content">
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {plan ? (
          <>
            <button className="back" onClick={() => setSelected(null)}>
              <ArrowLeft size={18} /> Back to {tab}
            </button>
            <div
              className={`detail-art art-${plan.groupId}`}
              aria-hidden="true"
            >
              <span>
                MAKE IT A<br />
                GOOD ONE.
              </span>
            </div>
            <p className="eyebrow">PRIVATE PLAN · SYNTHETIC</p>
            <h1>{plan.title}</h1>
            <p className="muted">
              {data.groups.find((g) => g.id === plan.groupId)?.name}
            </p>
            <p className="detail-line">
              <CalendarDays size={18} />
              {dateLabel(plan.date)} <Clock size={18} />
              {plan.time}
            </p>
            <p className="detail-line">
              <MapPin size={18} />
              {plan.place || "Location to be decided"}
            </p>
            <p>{plan.description}</p>
            <section>
              <div className="section-heading">
                <h2>Your attendance</h2>
                <button
                  className="text-button"
                  onClick={() => setEditing({ ...plan })}
                >
                  Edit plan
                </button>
              </div>
              <div className="segmented">
                {(["Going", "Maybe", "Not going"] as Attendance[]).map((a) => (
                  <button
                    key={a}
                    aria-pressed={plan.attendance === a}
                    onClick={() => {
                      setData(repository.attend(plan.id, a));
                      changed();
                    }}
                  >
                    {plan.attendance === a && <Check size={14} />} {a}
                  </button>
                ))}
              </div>
              <p className="fine">Sample attendance. No one is notified.</p>
            </section>
            <section className="panel">
              <p className="eyebrow">CREW POLL · SYNTHETIC VOTES</p>
              <h2>What’s the vibe?</h2>
              {["Keep it relaxed", "Make a night of it"].map((label, i) => (
                <button
                  className="poll-option"
                  aria-pressed={plan.vote === i}
                  key={label}
                  onClick={() => {
                    setData(repository.vote(plan.id, i));
                    changed();
                  }}
                >
                  <span>
                    {plan.vote === i ? "✓ " : ""}
                    {label}
                  </span>
                  <strong>{plan.votes[i]} votes</strong>
                  <span
                    className="poll-bar"
                    style={{
                      width: `${(100 * plan.votes[i]) / Math.max(1, plan.votes[0] + plan.votes[1])}%`,
                    }}
                  />
                </button>
              ))}
              <p className="fine">
                Your vote replaces your previous choice, in this tab only.
              </p>
            </section>
          </>
        ) : (
          <>
            {tab === "Home" && (
              <>
                <p className="eyebrow">LESS SCROLLING. MORE LIVING.</p>
                <h1>
                  Hey, {data.profile.name}
                  <span className="red">.</span>
                  <br />
                  <span className="muted">What’s the move?</span>
                </h1>
                <div className="section-heading">
                  <h2>Next up</h2>
                  <span className="live-dot">
                    YOU’RE {next.attendance.toUpperCase()}
                  </span>
                </div>
                <button className="hero" onClick={() => setSelected(next.id)}>
                  <div className="skyline" aria-hidden="true" />
                  <div className="hero-top">
                    <span className="pill">
                      {data.groups.find((g) => g.id === next.groupId)?.name}
                    </span>
                    <ArrowUpRight />
                  </div>
                  <div className="hero-bottom">
                    <p>
                      {dateLabel(next.date)} · {next.time}
                    </p>
                    <h2>{next.title}</h2>
                    <span>
                      <MapPin size={14} />
                      {next.place}
                    </span>
                    <div className="hero-footer">
                      <span className="faces">
                        A <b>S</b> <b>J</b> <b>+2</b>
                      </span>
                      <span>View plan ↗</span>
                    </div>
                  </div>
                </button>
                <div className="action-grid">
                  <button onClick={newPlan}>
                    <Plus />
                    <strong>Make a plan</strong>
                    <span>Give the group a reason.</span>
                  </button>
                  <button onClick={() => navigate("Groups")}>
                    <Users />
                    <strong>Your people</strong>
                    <span>Keep the good ones close.</span>
                  </button>
                </div>
                <div className="section-heading">
                  <h2>On the horizon</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("Plans")}
                  >
                    All plans ↗
                  </button>
                </div>
                {ordered.filter((p) => p.id !== next.id).map(row)}
                <p className="closing">
                  A little less “we should”.
                  <br />A little more “see you there”.
                </p>
              </>
            )}
            {tab === "Plans" && (
              <>
                <p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p>
                <div className="section-heading">
                  <h1>
                    Your plans<span className="red">.</span>
                  </h1>
                  <button
                    className="icon-button accent"
                    aria-label="Create plan"
                    onClick={newPlan}
                  >
                    <Plus />
                  </button>
                </div>
                <p className="muted">
                  Private to your crew. Synthetic in this prototype.
                </p>
                {ordered.map(row)}
              </>
            )}
            {tab === "Groups" && (
              <>
                <p className="eyebrow">GOOD COMPANY, ALWAYS</p>
                <h1>
                  {group
                    ? data.groups.find((g) => g.id === group)?.name
                    : "Your people"}
                  <span className="red">.</span>
                </h1>
                {group ? (
                  <>
                    <button className="back" onClick={() => setGroup(null)}>
                      <ArrowLeft size={18} /> All groups
                    </button>
                    <p>
                      {data.groups.find((g) => g.id === group)?.description}
                    </p>
                    <section className="panel">
                      <p className="eyebrow">PRIVATE · SYNTHETIC MEMBERS</p>
                      <div className="member-list">
                        {data.groups
                          .find((g) => g.id === group)
                          ?.members.map((m) => (
                            <span key={m}>
                              <span className="avatar">{m[0]}</span>
                              {m}
                            </span>
                          ))}
                      </div>
                    </section>
                    <div className="section-heading">
                      <h2>Group plans</h2>
                      <button className="text-button" onClick={newPlan}>
                        Make a plan +
                      </button>
                    </div>
                    {ordered.filter((p) => p.groupId === group).map(row)}
                  </>
                ) : (
                  data.groups.map((g) => (
                    <button
                      className="group-card panel"
                      key={g.id}
                      onClick={() => setGroup(g.id)}
                    >
                      <span className="group-symbol">{g.emoji}</span>
                      <span>
                        <small>PRIVATE GROUP</small>
                        <strong>{g.name}</strong>
                        <span>{g.members.length} synthetic members</span>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                  ))
                )}
              </>
            )}
            {tab === "Calendar" && (
              <>
                <p className="eyebrow">MAKE ROOM FOR THE GOOD STUFF</p>
                <h1>
                  Your calendar<span className="red">.</span>
                </h1>
                <section className="panel calendar">
                  <div className="section-heading">
                    <button
                      className="icon-button"
                      aria-label="Previous month"
                      onClick={() => {
                        setMonth(
                          new Date(
                            month.getFullYear(),
                            month.getMonth() - 1,
                            1,
                          ),
                        );
                        setDay("");
                      }}
                    >
                      <ChevronLeft />
                    </button>
                    <h2>
                      {month.toLocaleDateString("en", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <button
                      className="icon-button"
                      aria-label="Next month"
                      onClick={() => {
                        setMonth(
                          new Date(
                            month.getFullYear(),
                            month.getMonth() + 1,
                            1,
                          ),
                        );
                        setDay("");
                      }}
                    >
                      <ChevronRight />
                    </button>
                  </div>
                  <div className="calendar-grid">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <small key={i}>{d}</small>
                    ))}
                    {Array.from({ length: month.getDay() }, (_, i) => (
                      <span key={`blank${i}`} />
                    ))}
                    {Array.from(
                      {
                        length: new Date(
                          month.getFullYear(),
                          month.getMonth() + 1,
                          0,
                        ).getDate(),
                      },
                      (_, i) => {
                        const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                        return (
                          <button
                            key={key}
                            className={day === key ? "chosen" : ""}
                            aria-label={dateLabel(key)}
                            aria-pressed={day === key}
                            onClick={() => setDay(key)}
                          >
                            {i + 1}
                            {data.plans.some((p) => p.date === key) && <i />}
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>
                <div className="section-heading">
                  <h2>{day ? dateLabel(day) : "This month"}</h2>
                  <button className="text-button" onClick={() => setDay("")}>
                    Show month
                  </button>
                </div>
                {ordered
                  .filter((p) =>
                    day
                      ? p.date === day
                      : p.date.startsWith(
                          `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                        ),
                  )
                  .map(row)}
                {!ordered.some((p) =>
                  day
                    ? p.date === day
                    : p.date.startsWith(
                        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                      ),
                ) && (
                  <p className="empty">A little breathing room. Make a plan?</p>
                )}
                <button className="primary" onClick={newPlan}>
                  Make a plan <Plus size={18} />
                </button>
              </>
            )}
            {tab === "Profile" && (
              <>
                <p className="eyebrow">MAKE YOURSELF AT HOME</p>
                <h1>
                  Your profile<span className="red">.</span>
                </h1>
                <form
                  className="panel"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const values = new FormData(e.currentTarget);
                    setData(
                      repository.profile({
                        name: String(values.get("name")).trim() || "Alex",
                        bio: String(values.get("bio")),
                        avatar: String(values.get("avatar")),
                      }),
                    );
                    changed();
                  }}
                >
                  <p className="fine">
                    Fictional profile only. Do not enter real personal
                    information.
                  </p>
                  <label>
                    Display name
                    <input
                      name="name"
                      defaultValue={data.profile.name}
                      required
                      maxLength={30}
                    />
                  </label>
                  <label>
                    A little about you
                    <textarea
                      name="bio"
                      defaultValue={data.profile.bio}
                      maxLength={140}
                    />
                  </label>
                  <label>
                    Avatar
                    <select name="avatar" defaultValue={data.profile.avatar}>
                      {["A", "✺", "◒", "↗", "M"].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <button className="primary">Save synthetic profile</button>
                </form>
                <button
                  className="back"
                  onClick={() => {
                    setData(repository.reset());
                    changed();
                  }}
                >
                  Reset sample data
                </button>
                <button
                  className="back"
                  onClick={() => {
                    identity.signOut();
                    setData(repository.reset());
                    setActive(false);
                    navigate("Home");
                  }}
                >
                  End synthetic session
                </button>
              </>
            )}
            {tab === "Activity" && (
              <>
                <p className="eyebrow">IN THE LOOP</p>
                <h1>
                  Activity<span className="red">.</span>
                </h1>
                <p className="fine">
                  Illustrative activity only. No live updates or notifications.
                </p>
                {[
                  "Sam added a rooftop idea to The Weekenders.",
                  "Jamie voted to keep it relaxed.",
                  "Outside Club has a trail day coming up.",
                ].map((a, i) => (
                  <article className="activity panel" key={a}>
                    <span className="avatar">{["S", "J", "↗"][i]}</span>
                    <div>
                      <p>{a}</p>
                      <small>Sample activity · {i + 1}h ago</small>
                    </div>
                  </article>
                ))}
              </>
            )}
          </>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {(
          [
            { name: "Home", icon: House },
            { name: "Plans", icon: Compass },
            { name: "Groups", icon: Users },
            { name: "Calendar", icon: CalendarDays },
          ] as const
        ).map(({ name, icon: Icon }) => (
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
      <dialog
        ref={dialogRef}
        onCancel={() => setEditing(null)}
        onClose={() => setEditing(null)}
        aria-labelledby="plan-form-title"
      >
        {editing && (
          <>
            <div className="section-heading">
              <h2 id="plan-form-title">
                {data.plans.some((p) => p.id === editing.id)
                  ? "Edit your plan"
                  : "Make a plan"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close plan editor"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <p className="fine">
              Synthetic details only. Saved in this tab; nobody is invited.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  setData(
                    repository.savePlan({
                      ...editing,
                      title: String(f.get("title")).trim(),
                      groupId: String(f.get("group")),
                      date: String(f.get("date")),
                      time: String(f.get("time")),
                      place: String(f.get("place")),
                      description: String(f.get("description")),
                    }),
                  );
                  setEditing(null);
                  changed();
                } catch {
                  setNotice(
                    "Complete the plan title, date, time and private group.",
                  );
                }
              }}
            >
              <label>
                Plan name
                <input
                  name="title"
                  defaultValue={editing.title}
                  required
                  maxLength={80}
                  autoFocus
                />
              </label>
              <label>
                Private group
                <select name="group" defaultValue={editing.groupId}>
                  {data.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-pair">
                <label>
                  Date
                  <input
                    type="date"
                    name="date"
                    defaultValue={editing.date}
                    required
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    name="time"
                    defaultValue={editing.time}
                    required
                  />
                </label>
              </div>
              <label>
                Location
                <input
                  name="place"
                  defaultValue={editing.place}
                  maxLength={100}
                />
              </label>
              <label>
                The details
                <textarea
                  name="description"
                  defaultValue={editing.description}
                  maxLength={500}
                />
              </label>
              <button className="primary">
                Save sample plan <Check size={18} />
              </button>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
