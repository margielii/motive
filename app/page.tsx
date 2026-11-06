"use client";
import Image from "next/image";
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
  Clapperboard,
  CircleDot,
  Utensils,
  Gamepad2,
  Dumbbell,
  Pencil,
  MapPin,
  Clock,
  Info,
  Check,
  ChevronRight,
  BarChart3,
  Search,
  Mail,
  Shield,
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
  "Drink",
  "Other",
  "Custom",
];
const categoryIcons: Record<string, typeof Beer> = {
  Movie: Clapperboard,
  Soccer: CircleDot,
  Dinner: Utensils,
  FIFA: Gamepad2,
  Gym: Dumbbell,
  Drink: Beer,
  Drinks: Beer,
  Other: MoreHorizontal,
  Custom: Pencil,
};
function CategoryIcon({ category }: { category: string }) {
  const Icon = categoryIcons[category] ?? Sparkles;
  return <Icon size={22} aria-hidden="true" />;
}
function Avatar({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className={`avatar ${className}`}>
      {value.startsWith("data:image/") ? (
        <Image unoptimized src={value} alt="" width={110} height={110} />
      ) : (
        value
      )}
    </span>
  );
}
function AvatarStack({ ids, data }: { ids: string[]; data: Snapshot }) {
  return (
    <span className="avatar-stack" aria-label={`${ids.length} members`}>
      {ids.slice(0, 4).map((id) => (
        <Avatar
          key={id}
          value={data.people.find((p) => p.id === id)?.avatar ?? "?"}
        />
      ))}
      {ids.length > 4 && <span className="avatar">+{ids.length - 4}</span>}
    </span>
  );
}
function ImageUpload({ onChange }: { onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  return (
    <label>
      Upload image
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (
            !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
            file.size > 2 * 1024 * 1024
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
          reader.readAsDataURL(file);
        }}
      />
      {error && <span role="alert">{error}</span>}
    </label>
  );
}
function Artwork({
  value = "red",
  className = "",
  children,
  category,
}: {
  category?: string;
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
          : category && ["Movie", "FIFA", "Dinner"].includes(category)
            ? {
                backgroundImage: `url("/brand/${category === "Movie" ? "seats" : category === "FIFA" ? "controller" : "dinner"}-reference.png")`,
              }
            : undefined
      }
    >
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const update = (key: keyof Plan, v: string) => setP({ ...p, [key]: v });
  if (categoryOpen)
    return (
      <Modal title="Category" close={() => setCategoryOpen(false)}>
        <section className="category-options" aria-label="Category selection">
          <div className="section-heading">
            <span className="fine">Choose a category</span>
            <button
              type="button"
              className="icon-button"
              onClick={() => setCategoryOpen(false)}
              aria-label="Close categories"
            >
              <X />
            </button>
          </div>
          {categories.map((c) => (
            <button
              type="button"
              className="setting-row"
              aria-pressed={p.category === c}
              key={c}
              onClick={() => {
                update("category", c);
                if (c !== "Custom") setCategoryOpen(false);
              }}
            >
              <CategoryIcon category={c} />
              <strong>{c === "Custom" ? "Custom category" : c}</strong>
              {p.category === c && <Check />}
            </button>
          ))}
          {(p.category === "Custom" || !categories.includes(p.category)) && (
            <label>
              Custom category
              <input
                autoFocus
                value={p.category === "Custom" ? "" : p.category}
                onChange={(e) => update("category", e.target.value)}
              />
              <button
                type="button"
                className="primary"
                onClick={() => setCategoryOpen(false)}
              >
                Done
              </button>
            </label>
          )}
        </section>
      </Modal>
    );
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
        <label>
          Title
          <input
            required
            maxLength={80}
            value={p.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label>Category</label>
        <button
          type="button"
          className="setting-row"
          onClick={() => setCategoryOpen(true)}
        >
          <CategoryIcon category={p.category} />
          <strong>{p.category}</strong>
          <ChevronRight />
        </button>
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
          <legend>Invite people</legend>
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
        <details>
          <summary>Custom artwork</summary>
          <ArtPicker value={p.artwork} onChange={(v) => update("artwork", v)} />
        </details>
        <details>
          <summary>More options</summary>
          <label>
            Reminder
            <select
              value={p.reminder ?? ""}
              onChange={(e) => update("reminder", e.target.value)}
            >
              {["", "1 hour before", "1 day before"].map((r) => (
                <option key={r} value={r}>
                  {r || "None"}
                </option>
              ))}
            </select>
          </label>
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
  existing,
}: {
  existing: boolean;
  value: Poll;
  save: (p: Poll) => void;
  close: () => void;
}) {
  const [p, setP] = useState(value);
  const [error, setError] = useState("");
  return (
    <Modal title="Create Poll" close={close}>
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
        <div className="segmented poll-types" aria-label="Poll type">
          {(
            ["Date", "Time", "Location", "General Choice"] as Poll["kind"][]
          ).map((kind) => {
            const Icon =
              kind === "Date"
                ? CalendarDays
                : kind === "Time"
                  ? Clock
                  : kind === "Location"
                    ? MapPin
                    : BarChart3;
            return (
              <button
                type="button"
                key={kind}
                disabled={existing}
                aria-pressed={p.kind === kind}
                onClick={() => setP({ ...p, kind })}
              >
                <Icon size={20} />
                {kind === "General Choice" ? "Choice" : kind}
              </button>
            );
          })}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={p.multiple}
            disabled={existing}
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
        <label className="check">
          <input
            type="checkbox"
            checked={p.resultsBeforeVoting !== false}
            onChange={(e) =>
              setP({ ...p, resultsBeforeVoting: e.target.checked })
            }
          />
          Show results before voting
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
              className={`${date === d ? "chosen" : ""} ${stats(d) ? "busy-day" : (groupId ? groupAvailability(data, groupId, d, actor).some((m) => m.reported) : data.busy.some((b) => b.person === actor)) ? "open-day" : ""}`}
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
              {ranked
                .filter((d) => d.count === best.count)
                .slice(0, 3)
                .map((d) => dateLabel(d.d))
                .join(" · ")}
            </span>
          </button>
          <button className="panel" onClick={() => openBreakdown?.(worst.d)}>
            <strong>Most Busy</strong>
            <span>
              {worst.count
                ? ranked
                    .filter((d) => d.count === worst.count)
                    .slice(0, 3)
                    .map((d) => dateLabel(d.d))
                    .join(" · ")
                : "None reported"}
            </span>
          </button>
        </div>
      )}
    </>
  );
}
function GroupAvailabilityPage({
  data,
  group,
  actor,
  initialDate,
}: {
  data: Snapshot;
  group: Group;
  actor: string;
  initialDate: string;
}) {
  const [day, setDay] = useState(initialDate);
  const month = new Date(`${initialDate}T12:00:00`);
  const days = Array.from(
    {
      length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, i) => {
      const date = dayKey(
        new Date(month.getFullYear(), month.getMonth(), i + 1),
      );
      const members = groupAvailability(data, group.id, date, actor);
      return {
        date,
        busy: members.filter((m) => m.busy.length).length,
        reported: members.filter((m) => m.reported).length,
      };
    },
  );
  const best = [...days].sort((a, b) => a.busy - b.busy).slice(0, 3);
  const most = [...days]
    .filter((d) => d.busy > 0)
    .sort((a, b) => b.busy - a.busy)
    .slice(0, 3);
  return (
    <>
      <h1>Group Availability</h1>
      <p>
        {group.name} ·{" "}
        {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
      </p>
      <div className="availability-summary">
        <div className="panel open-summary">
          <CalendarDays />
          <h2>Best days</h2>
          <small>{best.map((d) => dateLabel(d.date)).join(" · ")}</small>
        </div>
        <div className="panel busy-summary">
          <Users />
          <h2>Most busy</h2>
          <small>
            {most.map((d) => dateLabel(d.date)).join(" · ") ||
              "No busy dates reported"}
          </small>
        </div>
      </div>
      <p className="fine">
        Based on reported busy periods. Unreported time does not guarantee
        availability. Edit your busy periods in your personal Calendar.
      </p>
      <h2>Availability overview</h2>
      <section className="panel setting-list">
        {days.map((d) => (
          <button
            className="setting-row"
            aria-pressed={day === d.date}
            key={d.date}
            onClick={() => setDay(d.date)}
          >
            <strong>{dateLabel(d.date)}</strong>
            <span>
              {d.busy ? `${d.busy} busy` : "No busy time reported"} ·{" "}
              {group.members.length - d.reported} unknown
            </span>
            <ChevronRight />
          </button>
        ))}
      </section>
      <h2>{dateLabel(day)}</h2>
      <section className="panel setting-list">
        {groupAvailability(data, group.id, day, actor).map((m) => (
          <div className="setting-row" key={m.person.id}>
            <Avatar value={m.person.avatar} />
            <strong>{m.person.name}</strong>
            <span>
              {m.busy.length
                ? m.busy
                    .map((b) =>
                      b.start ? `${b.start}–${b.end}` : "Busy all day",
                    )
                    .join(", ")
                : m.reported
                  ? "No busy time reported"
                  : "Unknown"}
            </span>
          </div>
        ))}
      </section>
      <h2>Member availability</h2>
      <section className="panel setting-list">
        {group.members.map((id) => (
          <div key={id} className="setting-row">
            <Avatar
              value={data.people.find((p) => p.id === id)?.avatar ?? "?"}
            />
            <strong>{data.people.find((p) => p.id === id)?.name}</strong>
            <span>
              {data.busy.some((b) => b.person === id)
                ? `${days.filter((d) => data.busy.some((b) => b.person === id && isBusy(b, d.date))).length} busy days`
                : "Unknown"}
            </span>
          </div>
        ))}
      </section>
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
  const [detailTab, setDetailTab] = useState("Overview");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupTab, setGroupTab] = useState("Motives");
  const [pollId, setPollId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("List");
  const [notice, setNotice] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [friendInvite, setFriendInvite] = useState(false);
  const [calendarView, setCalendarView] = useState("Month");
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
  const open = (p: Plan, t = "Overview") => {
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
      <Artwork value={p.artwork} category={p.category} />
      <span className="row-copy">
        <strong>{p.title}</strong>
        <small>
          <CalendarDays size={13} />
          {dateLabel(p.date)} · {p.time || "Time undecided"}
        </small>
        <span>
          <Users size={13} />
          {Object.values(p.responses).filter((r) => r === "Going").length} going
          {p.place ? ` · ${p.place}` : ""}
        </span>
        <span
          className={`status ${p.status === "Cancelled" ? "cancelled" : ""}`}
        >
          {p.draft ? "Private draft" : p.status}
          {p.recurrence ? ` · ${p.recurrence}` : ""}
        </span>
      </span>
      <ChevronRight size={18} />
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
          <Image
            unoptimized
            src="/brand/wordmark-reference.png"
            alt="MOTIVE"
            width="342"
            height="79"
          />
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
          Explore as Alex <ChevronRight size={18} />
        </button>
      </main>
    );
  return (
    <div
      className={`app-shell ${selected || groupId || breakdown ? "detail-page" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="topbar">
        {tab === "Home" || selected || groupId || breakdown ? (
          <button
            className="wordmark"
            aria-label="MOTIVE Home"
            onClick={() => navigate("Home")}
          >
            <Image
              unoptimized
              src="/brand/wordmark-reference.png"
              alt="MOTIVE"
              width="342"
              height="79"
            />
          </button>
        ) : tab === "Friends" ? (
          <button
            className="icon-button"
            aria-label="Back to Profile"
            onClick={() => navigate("Profile")}
          >
            <ArrowLeft />
          </button>
        ) : (
          <h1>{tab}</h1>
        )}
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
            <Avatar value={person.avatar} />
          </button>
        </div>
      </header>
      <p className="demo-banner">Local demo</p>
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
          <GroupAvailabilityPage
            data={data}
            group={g}
            actor={actor}
            initialDate={breakdown}
          />
        ) : poll && motive ? (
          (() => {
            const results = pollResults(poll),
              closed = pollClosed(poll, clock),
              choices = poll.ballots[actor] ?? [],
              showResults =
                closed ||
                poll.resultsBeforeVoting !== false ||
                choices.length > 0 ||
                poll.creator === actor;
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
                  {showResults
                    ? `${results.votes} votes · ${results.voters} unique voters`
                    : "Vote to see results"}
                  {showResults && tied ? " · Tied — no automatic winner" : ""}
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
                      <span className="vote-circle" aria-hidden="true" />
                      <span>
                        {o.label}
                        {o.suggestedBy && (
                          <small>
                            Suggested by{" "}
                            {data.people.find((p) => p.id === o.suggestedBy)
                              ?.name || "a member"}
                          </small>
                        )}
                      </span>
                      {showResults && (
                        <>
                          <strong>
                            {results.counts[i]} votes ·{" "}
                            {Math.round(
                              (100 * results.counts[i]) /
                                Math.max(1, results.voters),
                            )}
                            %
                          </strong>
                          <span className="poll-track">
                            <span
                              className="poll-bar"
                              style={{
                                width: `${(100 * results.counts[i]) / Math.max(1, results.voters)}%`,
                              }}
                            />
                          </span>
                        </>
                      )}
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
            <div className="motive-heading">
              <span className="category-art">
                <CategoryIcon category={motive.category} />
              </span>
              <div>
                <h1>{motive.title}</h1>
                <p className="fine">
                  {data.groups.find((g) => g.id === motive.groupId)?.name ||
                    "Friends"}
                </p>
              </div>
              <div className="section-heading">
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
                                repo.savePlan({
                                  ...motive,
                                  status: "Cancelled",
                                }),
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
            </div>
            <p
              className={`status ${motive.status === "Cancelled" ? "cancelled" : ""}`}
            >
              {motive.draft ? "Private draft" : motive.status}
            </p>
            <div className="segmented">
              {["Overview", "Polls", "Attendance", "Details"].map((t) => (
                <button
                  key={t}
                  aria-pressed={detailTab === t}
                  onClick={() => setDetailTab(t)}
                >
                  {t === "Overview" ? (
                    <House size={18} />
                  ) : t === "Polls" ? (
                    <BarChart3 size={18} />
                  ) : t === "Attendance" ? (
                    <Users size={18} />
                  ) : (
                    <Info size={18} />
                  )}
                  {t}
                </button>
              ))}
            </div>
            {detailTab === "Overview" ? (
              <>
                <section className="panel setting-list">
                  <button
                    className="setting-row"
                    onClick={() => setDetailTab("Polls")}
                  >
                    <CalendarDays />
                    <span>
                      <strong>Date</strong>
                      <small>
                        {dateLabel(motive.date)}
                        {motive.time
                          ? ` · ${motive.time}`
                          : " · Time undecided"}
                      </small>
                    </span>
                    {!motive.date && <span className="status">Poll</span>}
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="setting-row"
                    onClick={() => setDetailTab("Polls")}
                  >
                    <MapPin />
                    <span>
                      <strong>Location</strong>
                      <small>{motive.place || "Undecided"}</small>
                    </span>
                    {!motive.place && <span className="status">Poll</span>}
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="setting-row"
                    onClick={() => setDetailTab("Attendance")}
                  >
                    <Users />
                    <span>
                      <strong>Attendance</strong>
                      <small>
                        {
                          Object.values(motive.responses).filter(
                            (r) => r === "Going",
                          ).length
                        }{" "}
                        going ·{" "}
                        {
                          motive.invitees.filter(
                            (id) =>
                              !motive.responses[id] ||
                              motive.responses[id] === "No Response",
                          ).length
                        }{" "}
                        not yet responded
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </section>
                <h2>About</h2>
                <p className="panel">
                  {motive.description || "No notes added."}
                </p>
                {data.polls.some(
                  (p) =>
                    p.planId === motive.id &&
                    !pollClosed(p, clock) &&
                    !p.ballots[actor]?.length,
                ) && (
                  <button
                    className="panel setting-row full-width"
                    onClick={() => setDetailTab("Polls")}
                  >
                    <BarChart3 />
                    <span>
                      <strong>Open polls</strong>
                      <small>Add your vote</small>
                    </span>
                    <ChevronRight />
                  </button>
                )}
                <button
                  className="primary full-width"
                  onClick={() => setDetailTab("Attendance")}
                >
                  <Check size={18} />
                  Respond
                </button>
              </>
            ) : detailTab === "Details" ? (
              <>
                <h2>Planning</h2>
                <section className="panel setting-list">
                  <div className="setting-row">
                    <Sparkles />
                    <strong>Status</strong>
                    <span>{motive.status}</span>
                  </div>
                  <div className="setting-row">
                    <CalendarDays />
                    <strong>Voting deadline</strong>
                    <span>
                      {data.polls
                        .filter((p) => p.planId === motive.id && p.deadline)
                        .map((p) => new Date(p.deadline).toLocaleString())
                        .join(", ") || "Not set"}
                    </span>
                  </div>
                  <div className="setting-row">
                    <Bell />
                    <strong>Reminder</strong>
                    <span>{motive.reminder || "None"}</span>
                  </div>
                  <div className="setting-row">
                    <Clock />
                    <strong>Repeat</strong>
                    <span>{motive.recurrence || "Never"}</span>
                  </div>
                </section>
                <h2>People</h2>
                <section className="panel setting-list">
                  <div className="setting-row">
                    <Users />
                    <strong>Group</strong>
                    <span>
                      {data.groups.find((g) => g.id === motive.groupId)?.name ||
                        "Friends"}
                    </span>
                  </div>
                  <div className="setting-row">
                    <Users />
                    <strong>Invited</strong>
                    <span>{motive.invitees.length} people</span>
                  </div>
                </section>
                {motive.organizer === actor && (
                  <>
                    <h2>Actions</h2>
                    <div className="panel setting-list">
                      <button
                        className="setting-row"
                        onClick={() => setEditing(motive)}
                      >
                        <Pencil />
                        <strong>Edit Motive</strong>
                        <ChevronRight />
                      </button>
                      <button
                        className="setting-row"
                        onClick={() =>
                          setEditing({
                            ...motive,
                            id: crypto.randomUUID(),
                            title: `${motive.title} copy`,
                            draft: true,
                            responses: {},
                            votes: [0, 0],
                            vote: null,
                          })
                        }
                      >
                        <Plus />
                        <strong>Duplicate Motive</strong>
                        <ChevronRight />
                      </button>
                    </div>
                  </>
                )}
              </>
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
                          {p.resultsBeforeVoting === false &&
                          !pollClosed(p, clock) &&
                          !p.ballots[actor]?.length &&
                          p.creator !== actor
                            ? "Vote to see results"
                            : `${pollResults(p).votes} votes · ${pollResults(p).voters} voters`}
                        </small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
              </>
            ) : (
              <>
                <h2>Your response</h2>
                <div className="segmented">
                  {(["Going", "Can't Go"] as Attendance[]).map((a) => (
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
                  ))}
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
                          <div className="member" key={id}>
                            <Avatar
                              value={
                                data.people.find((p) => p.id === id)?.avatar ??
                                "?"
                              }
                            />
                            <strong>
                              {data.people.find((p) => p.id === id)?.name}
                            </strong>
                          </div>
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

                {next ? (
                  <button className="hero-button" onClick={() => open(next)}>
                    <Artwork
                      value={next.artwork}
                      category={next.category}
                      className="hero"
                    >
                      <span className="hero-top">
                        <span className="next-badge">Next Up</span>
                        <ArrowUpRight />
                      </span>
                      <span className="hero-bottom">
                        <strong>{next.title}</strong>
                        <small>
                          <CalendarDays size={14} />
                          {dateLabel(next.date)} ·{" "}
                          {next.time || "Time undecided"}
                        </small>
                        <span>{next.place || "Location undecided"}</span>
                        <span className="participation">
                          <AvatarStack
                            ids={next.invitees.filter(
                              (id) => next.responses[id] === "Going",
                            )}
                            data={data}
                          />
                          <small>
                            {
                              Object.values(next.responses).filter(
                                (r) => r === "Going",
                              ).length
                            }{" "}
                            going · {next.status}
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
                    <div className="section-heading">
                      <h2>Needs You</h2>
                      <span className="count-badge">
                        {live.filter(
                          (p) =>
                            (p.responses[actor] ?? "No Response") ===
                            "No Response",
                        ).length +
                          data.polls.filter(
                            (p) =>
                              !pollClosed(p, clock) &&
                              !p.ballots[actor]?.length &&
                              live.some((m) => m.id === p.planId),
                          ).length}
                      </span>
                    </div>
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
                    See all →
                  </button>
                </div>
                {list(
                  live
                    .filter(
                      (p) =>
                        p.id !== next?.id && (!p.date || p.date >= today()),
                    )
                    .slice(0, 3),
                )}
              </>
            )}
            {tab === "Motives" && (
              <>
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
                  <div className="group-heading">
                    <Artwork value={g.artwork} className="group-art" />
                    <div>
                      <h1>{g.name}</h1>
                      <p className="fine">{g.members.length} members</p>
                    </div>
                  </div>
                  <div className="section-heading">
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
                    <>
                      {["Upcoming", "Past"].map((label) => (
                        <section key={label}>
                          <h2>{label}</h2>
                          {list(
                            ordered.filter(
                              (p) =>
                                p.groupId === g.id &&
                                !p.draft &&
                                (label === "Past"
                                  ? !!p.date && p.date < today()
                                  : !p.date || p.date >= today()),
                            ),
                          )}
                        </section>
                      ))}
                      <button
                        className="primary full-width"
                        onClick={() => setChoice(true)}
                      >
                        <Plus />
                        Create Motive
                      </button>
                    </>
                  ) : groupTab === "Members" ? (
                    g.members
                      .map((id) => (
                        <article className="panel member" key={id}>
                          <Avatar
                            value={
                              data.people.find((p) => p.id === id)?.avatar ??
                              "?"
                            }
                          />
                          <strong>
                            {data.people.find((p) => p.id === id)?.name}
                          </strong>
                          <small>
                            {g.organizer === id ? "Organizer" : "Member"}
                          </small>
                        </article>
                      ))
                      .concat(
                        g.organizer === actor
                          ? [
                              <button
                                key="invite"
                                className="secondary full-width"
                                onClick={() => setEditGroup(g)}
                              >
                                <Users />
                                Invite people
                              </button>,
                            ]
                          : [],
                      )
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
                      <button
                        className="primary full-width"
                        onClick={() => setChoice(true)}
                      >
                        <Plus />
                        Create Motive
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="section-heading">
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
                          <small>{g.members.length} members</small>
                          <AvatarStack ids={g.members} data={data} />
                        </span>
                        <ChevronRight size={18} />
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
                <div className="segmented">
                  {["Month", "Upcoming"].map((v) => (
                    <button
                      key={v}
                      aria-pressed={calendarView === v}
                      onClick={() => setCalendarView(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {calendarView === "Month" ? (
                  <Month
                    data={data}
                    actor={actor}
                    date={date}
                    setDate={setDate}
                  />
                ) : (
                  list(live.filter((p) => !!p.date && p.date >= today()))
                )}
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
                            open(p, n.pollId ? "Polls" : "Overview");
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
                  <Avatar value={person.avatar} />
                  <h1>{person.name}</h1>
                </div>
                <details className="panel">
                  <summary>Edit profile</summary>
                  <form
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
                    <input type="hidden" name="avatar" value={person.avatar} />
                    <ImageUpload
                      onChange={(avatar) =>
                        run(() => repo.profile({ name: person.name, avatar }))
                      }
                    />
                    <button className="primary">Save profile</button>
                  </form>
                </details>
                <section className="panel setting-list">
                  <button
                    className="setting-row"
                    onClick={() => navigate("Friends")}
                  >
                    <Users />
                    <span>
                      <strong>Friends</strong>
                      <small>{data.friends.length} friends</small>
                    </span>
                    <ChevronRight />
                  </button>
                  <button
                    className="setting-row"
                    onClick={() => navigate("Friends")}
                  >
                    <Mail />
                    <span>
                      <strong>Invitations</strong>
                      <small>{data.requests.length} pending</small>
                    </span>
                    <ChevronRight />
                  </button>
                </section>
                <h2>Settings</h2>
                <section className="panel setting-list">
                  <button
                    className="setting-row"
                    onClick={() => navigate("Notifications")}
                  >
                    <Bell />
                    <strong>Notifications</strong>
                    <ChevronRight />
                  </button>
                  <details>
                    <summary className="setting-row">
                      <Shield />
                      <strong>Privacy</strong>
                    </summary>
                    <p className="fine">
                      Owner-only prototype. Local state resets on reload. No
                      real invitations or external notifications.
                    </p>
                  </details>
                  <details>
                    <summary className="setting-row">
                      <Info />
                      <strong>Account & About</strong>
                    </summary>
                    <p className="fine">
                      MOTIVE · synthetic accounts for local testing.
                    </p>
                  </details>
                </section>
              </>
            )}
            {tab === "Friends" && (
              <>
                <div className="section-heading">
                  <div>
                    <h1>Friends</h1>
                    <p className="fine">{data.friends.length} friends</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => setFriendInvite(true)}
                  >
                    <Plus size={18} />
                    Add Friend
                  </button>
                </div>
                <label className="search-field">
                  <Search size={20} />
                  <input
                    aria-label="Search friends"
                    placeholder="Search friends"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                </label>
                <section className="panel setting-list">
                  {data.friends
                    .filter((id) =>
                      data.people
                        .find((p) => p.id === id)
                        ?.name.toLowerCase()
                        .includes(friendSearch.toLowerCase()),
                    )
                    .map((id) => (
                      <div className="setting-row" key={id}>
                        <Avatar
                          value={
                            data.people.find((p) => p.id === id)?.avatar ?? "?"
                          }
                        />
                        <strong>
                          {data.people.find((p) => p.id === id)?.name}
                        </strong>
                      </div>
                    ))}
                  {!data.friends.some((id) =>
                    data.people
                      .find((p) => p.id === id)
                      ?.name.toLowerCase()
                      .includes(friendSearch.toLowerCase()),
                  ) && <p className="fine">No matching friends.</p>}
                </section>
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
              </>
            )}
            {tab === "Profile" && (
              <>
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
      {friendInvite && (
        <Modal title="Add Friend" close={() => setFriendInvite(false)}>
          <p className="fine">Synthetic requests only. Nobody is contacted.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const username = String(
                new FormData(e.currentTarget).get("username"),
              ).trim();
              if (run(() => repo.requestFriend(username)))
                setFriendInvite(false);
            }}
          >
            <label>
              Friend username
              <input name="username" required placeholder="riley.demo" />
            </label>
            <button className="primary full-width">Send request</button>
          </form>
          <p className="fine">
            {(data.sentRequests ?? [])
              .map((id) => data.people.find((p) => p.id === id)?.name)
              .join(", ") || "No requests sent"}
          </p>
        </Modal>
      )}
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
            setDetailTab("Overview");
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
          existing={data.polls.some((p) => p.id === editPoll.id)}
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
