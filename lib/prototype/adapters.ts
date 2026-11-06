import type {
  Busy,
  Group,
  IdentityAdapter,
  Plan,
  PlanRepository,
  Poll,
  Snapshot,
} from "./model";
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function pollClosed(p: Poll, now = Date.now()) {
  return p.closed || (!!p.deadline && new Date(p.deadline).getTime() <= now);
}
export function pollResults(p: Poll) {
  const counts = p.options.map(
    (o) => Object.values(p.ballots).filter((b) => b.includes(o.id)).length,
  );
  return {
    counts,
    votes: counts.reduce((a, b) => a + b, 0),
    voters: Object.values(p.ballots).filter((b) => b.length).length,
  };
}
export function isBusy(b: Busy, date: string) {
  if (date < b.date) return false;
  if (date <= b.endDate) return true;
  if (b.recurrence !== "Weekly") return false;
  const offset =
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${b.date}T12:00:00Z`)) /
    86400000;
  const span =
    (Date.parse(`${b.endDate}T12:00:00Z`) - Date.parse(`${b.date}T12:00:00Z`)) /
    86400000;
  return offset % 7 <= span;
}
export function motiveOnDate(p: Plan, date: string) {
  if (p.draft || !p.date || date < p.date) return false;
  if (p.date === date) return true;
  if (p.status === "Cancelled") return false;
  if (p.recurrence === "Weekly")
    return (
      ((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${p.date}T12:00:00Z`)) /
        86400000) %
        7 ===
      0
    );
  if (p.recurrence === "Monthly") return date.slice(-2) === p.date.slice(-2);
  return false;
}
export function groupAvailability(
  s: Snapshot,
  groupId: string,
  date: string,
  actor: string,
) {
  const g = s.groups.find((g) => g.id === groupId);
  if (!g?.members.includes(actor))
    throw new Error("Only group members can view availability");
  return g.members.map((id) => ({
    person: s.people.find((p) => p.id === id)!,
    busy: s.busy.filter((b) => b.person === id && isBusy(b, date)),
    reported: s.busy.some((b) => b.person === id),
  }));
}
function seed(): Snapshot {
  const day = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return dayKey(d);
  };
  const people = [
    { id: "alex", name: "Alex", username: "alex.demo", avatar: "A" },
    { id: "sam", name: "Sam", username: "sam.demo", avatar: "S" },
    { id: "jamie", name: "Jamie", username: "jamie.demo", avatar: "J" },
    { id: "riley", name: "Riley", username: "riley.demo", avatar: "R" },
  ];
  const groups: Group[] = [
    {
      id: "weekenders",
      name: "The Weekenders",
      emoji: "✺",
      members: ["alex", "sam", "jamie"],
      description: "Our weekend crew",
      organizer: "alex",
      artwork: "red",
    },
    {
      id: "table",
      name: "At the Table",
      emoji: "◒",
      members: ["alex", "riley"],
      description: "Dinner with friends",
      organizer: "riley",
      artwork: "violet",
    },
    {
      id: "outside",
      name: "Outside Club",
      emoji: "↗",
      members: ["alex", "sam"],
      description: "Fresh air and familiar faces",
      organizer: "alex",
      artwork: "green",
    },
  ];
  const plans: Plan[] = [
    {
      id: "night",
      title: "A night above it all",
      groupId: "weekenders",
      date: day(1),
      time: "19:30",
      place: "The rooftop · Downtown",
      description: "Meet upstairs for the sunset.",
      attendance: "Going",
      votes: [3, 1],
      vote: null,
      organizer: "alex",
      invitees: ["alex", "sam", "jamie"],
      responses: { alex: "Going", sam: "Going" },
      status: "Confirmed",
      draft: false,
      category: "Drinks",
      recurrence: "",
      artwork: "red",
      kind: "Motive",
    },
    {
      id: "dinner",
      title: "One more course",
      groupId: "table",
      date: day(3),
      time: "",
      place: "",
      description: "Choose a place together.",
      attendance: "No Response",
      votes: [1, 2],
      vote: null,
      organizer: "riley",
      invitees: ["alex", "riley"],
      responses: {},
      status: "Planning",
      draft: false,
      category: "Dinner",
      recurrence: "",
      artwork: "violet",
      kind: "Motive",
    },
    {
      id: "trail",
      title: "Take the scenic route",
      groupId: "outside",
      date: day(9),
      time: "09:00",
      place: "North trailhead",
      description: "Bring water and a warm layer.",
      attendance: "No Response",
      votes: [2, 1],
      vote: null,
      organizer: "alex",
      invitees: ["alex", "sam"],
      responses: {},
      status: "Planning",
      draft: false,
      category: "Other",
      recurrence: "Weekly",
      artwork: "green",
      kind: "Event",
    },
  ];
  const polls: Poll[] = [
    {
      id: "vibe",
      planId: "night",
      creator: "alex",
      question: "What’s the vibe?",
      kind: "General Choice",
      multiple: false,
      suggestions: true,
      deadline: "",
      closed: false,
      options: [
        { id: "relaxed", label: "Keep it relaxed" },
        { id: "nightout", label: "Make a night of it" },
      ],
      ballots: { sam: ["relaxed"], jamie: ["nightout"] },
      outcome: null,
    },
    {
      id: "where",
      planId: "dinner",
      creator: "riley",
      question: "Where shall we eat?",
      kind: "Location",
      multiple: true,
      suggestions: true,
      deadline: "",
      closed: false,
      options: [
        { id: "italy", label: "Little Italy" },
        { id: "market", label: "Market Hall" },
      ],
      ballots: { riley: ["italy"] },
      outcome: null,
    },
  ];
  return {
    people,
    groups,
    plans,
    polls,
    profile: { name: "Alex", avatar: "A" },
    busy: [
      {
        id: "sam-busy",
        person: "sam",
        date: day(1),
        endDate: day(1),
        start: "",
        end: "",
        recurrence: "None",
      },
    ],
    notifications: [],
    friends: ["sam", "jamie"],
    requests: ["riley"],
  };
}
// Synthetic authority checks exercise local roles only. Production APIs remain disabled.
export function createMockRepository(): PlanRepository {
  let state = seed(),
    actor = "alex";
  const snapshot = () =>
    structuredClone({
      ...state,
      plans: state.plans.filter((p) =>
        p.draft
          ? p.organizer === actor
          : p.organizer === actor || p.invitees.includes(actor),
      ),
      groups: state.groups.filter((g) => g.members.includes(actor)),
      polls: state.polls.filter((p) =>
        state.plans.some(
          (m) =>
            m.id === p.planId &&
            (m.organizer === actor || (!m.draft && m.invitees.includes(actor))),
        ),
      ),
      busy: state.busy.filter(
        (b) =>
          b.person === actor ||
          state.groups.some(
            (g) => g.members.includes(actor) && g.members.includes(b.person),
          ),
      ),
      notifications: state.notifications.filter((n) => n.person === actor),
    });
  const plan = (id: string) => {
    const p = state.plans.find((p) => p.id === id);
    if (
      !p ||
      (!(p.organizer === actor) && (!p.invitees.includes(actor) || p.draft))
    )
      throw new Error("You do not have access to this Motive");
    return p;
  };
  const owner = (p: Plan) => {
    if (p.organizer !== actor)
      throw new Error("Only the organizer can do this");
  };
  const notify = (
    person: string,
    text: string,
    planId: string,
    key: string,
    pollId?: string,
  ) => {
    state.notifications = state.notifications.filter(
      (n) => !(n.person === person && n.key === key),
    );
    state.notifications.push({
      id: crypto.randomUUID(),
      person,
      text,
      planId,
      pollId,
      key,
      at: Math.max(Date.now(), ...state.notifications.map((n) => n.at + 1)),
      read: false,
    });
  };
  const poll = (id: string) => {
    const p = state.polls.find((p) => p.id === id);
    if (!p) throw new Error("Poll not found");
    plan(p.planId);
    return p;
  };
  const editable = (p: Poll) => {
    if (p.creator !== actor)
      throw new Error("Only the poll creator can do this");
  };
  return {
    snapshot,
    setActor(id) {
      if (!state.people.some((p) => p.id === id))
        throw new Error("Unknown synthetic member");
      actor = id;
    },
    savePlan(value) {
      const p = structuredClone(value);
      const old = state.plans.find((x) => x.id === p.id);
      if (old) {
        owner(plan(p.id));
      } else if (p.organizer !== actor) throw new Error("Invalid organizer");
      if (!p.title.trim()) throw new Error("A title is required");
      if (p.date && !/^\d{4}-\d{2}-\d{2}$/.test(p.date))
        throw new Error("Invalid date");
      if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time))
        throw new Error("Invalid time");
      const g = state.groups.find((g) => g.id === p.groupId);
      if (p.groupId && !g?.members.includes(actor))
        throw new Error("Choose a private group you belong to");
      if (p.invitees.some((id) => !state.people.some((x) => x.id === id)))
        throw new Error("Unknown member");
      p.invitees = [...new Set([actor, ...p.invitees, ...(g?.members ?? [])])];
      if (old) {
        p.responses = old.responses;
        p.votes = old.votes;
        p.vote = old.vote;
      }
      state.plans = old
        ? state.plans.map((x) => (x.id === p.id ? p : x))
        : [...state.plans, p];
      if (!p.draft)
        p.invitees
          .filter((id) => id !== actor)
          .forEach((id) =>
            notify(
              id,
              p.status === "Cancelled"
                ? `${p.title} was cancelled`
                : old
                  ? `${p.title} details updated`
                  : `Synthetic invitation: ${p.title}`,
              p.id,
              `motive:${p.id}`,
            ),
          );
      return snapshot();
    },
    attend(id, value) {
      if (!["Going", "Can't Go", "No Response"].includes(value))
        throw new Error("Invalid attendance");
      const p = plan(id);
      if (p.status === "Cancelled" || p.draft)
        throw new Error("Attendance unavailable");
      p.responses[actor] = value;
      p.attendance = p.responses.alex ?? "No Response";
      if (actor !== p.organizer)
        notify(
          p.organizer,
          `${actor} updated attendance`,
          id,
          `attendance:${id}:${actor}`,
        );
      return snapshot();
    },
    vote(id, option) {
      const p = plan(id);
      if (option !== 0 && option !== 1) throw new Error("Invalid option");
      if (p.vote !== null) p.votes[p.vote]--;
      p.votes[option]++;
      p.vote = option;
      return snapshot();
    },
    requestFriend(username) {
      if (actor !== "alex")
        throw new Error("Friend requests are an Alex-only demonstration");
      const target = state.people.find(
        (p) => p.username.toLowerCase() === username.toLowerCase(),
      );
      if (!target || target.id === actor)
        throw new Error("Enter another fictional member's username");
      if (state.friends.includes(target.id)) throw new Error("Already friends");
      state.sentRequests = [
        ...new Set([...(state.sentRequests ?? []), target.id]),
      ];
      return snapshot();
    },
    profile(p) {
      if (!p.name.trim()) throw new Error("Display name is required");
      const person = state.people.find((p) => p.id === actor)!;
      person.name = p.name.trim();
      person.avatar = p.avatar;
      if (actor === "alex") state.profile = { ...p };
      return snapshot();
    },
    reset() {
      state = seed();
      actor = "alex";
      return snapshot();
    },
    saveGroup(value) {
      const g = structuredClone(value);
      const old = state.groups.find((x) => x.id === g.id);
      if (old && old.organizer !== actor)
        throw new Error("Only the group organizer can edit members");
      if (
        g.organizer !== actor ||
        !g.name.trim() ||
        g.members.some((id) => !state.people.some((p) => p.id === id))
      )
        throw new Error("Invalid group");
      g.members = [...new Set([actor, ...g.members])];
      state.groups = old
        ? state.groups.map((x) => (x.id === g.id ? g : x))
        : [...state.groups, g];
      return snapshot();
    },
    savePoll(value) {
      const p = structuredClone(value);
      const m = plan(p.planId);
      if (m.status === "Cancelled" || m.draft)
        throw new Error("Poll unavailable");
      const old = state.polls.find((x) => x.id === p.id);
      if (old) {
        editable(old);
        if (old.planId !== p.planId) throw new Error("Poll cannot move Motive");
      } else if (m.organizer !== actor)
        throw new Error("Only the organizer can create polls");
      if (
        p.creator !== actor ||
        !p.question.trim() ||
        p.options.length < 2 ||
        p.options.some((o) => !o.label.trim()) ||
        new Set(p.options.map((o) => o.id)).size !== p.options.length
      )
        throw new Error("Provide a question and at least two distinct options");
      if (p.deadline && Number.isNaN(new Date(p.deadline).getTime()))
        throw new Error("Invalid deadline");
      if (old && (old.multiple !== p.multiple || old.kind !== p.kind))
        throw new Error(
          "Poll type and choice mode cannot change after creation",
        );
      p.ballots = old ? structuredClone(old.ballots) : {};
      p.closed = old?.closed ?? false;
      p.outcome = old?.outcome ?? null;
      if (old) {
        const affected = new Set(
          old.options
            .filter(
              (o) =>
                !p.options.some(
                  (n) => n.id === o.id && n.label.trim() === o.label.trim(),
                ),
            )
            .map((o) => o.id),
        );
        Object.entries(p.ballots).forEach(([voter, choices]) => {
          if (choices.some((id) => affected.has(id))) {
            p.ballots[voter] = choices.filter((id) => !affected.has(id));
            notify(
              voter,
              `Options changed in “${p.question}”. Review your vote.`,
              p.planId,
              `revote:${p.id}:${voter}`,
              p.id,
            );
          }
        });
        if (p.outcome && affected.has(p.outcome)) p.outcome = null;
      }
      state.polls = old
        ? state.polls.map((x) => (x.id === p.id ? p : x))
        : [...state.polls, p];
      return snapshot();
    },
    cast(id, choices) {
      const p = poll(id);
      if (pollClosed(p) || plan(p.planId).status === "Cancelled")
        throw new Error("Voting is closed");
      const unique = [...new Set(choices)];
      if (
        (!p.multiple && unique.length > 1) ||
        unique.some((id) => !p.options.some((o) => o.id === id))
      )
        throw new Error("Invalid choices");
      p.ballots[actor] = unique;
      return snapshot();
    },
    suggest(id, label) {
      const p = poll(id);
      if (
        !p.suggestions ||
        pollClosed(p) ||
        plan(p.planId).status === "Cancelled"
      )
        throw new Error("Suggestions are unavailable");
      if (
        !label.trim() ||
        p.options.some(
          (o) => o.label.toLowerCase() === label.trim().toLowerCase(),
        )
      )
        throw new Error("Enter a new option");
      p.options.push({
        id: crypto.randomUUID(),
        label: label.trim(),
        suggestedBy: actor,
      });
      return snapshot();
    },
    closePoll(id) {
      const p = poll(id);
      editable(p);
      p.closed = true;
      return snapshot();
    },
    applyOutcome(id, option) {
      const p = poll(id);
      editable(p);
      const m = plan(p.planId);
      owner(m);
      if (!pollClosed(p))
        throw new Error("Close the poll before applying an outcome");
      if (m.status === "Cancelled") throw new Error("Motive is cancelled");
      const o = p.options.find((o) => o.id === option);
      if (!o) throw new Error("Choose an outcome explicitly");
      if (p.kind === "Date" && !/^\d{4}-\d{2}-\d{2}$/.test(o.label))
        throw new Error("Date outcome must use YYYY-MM-DD");
      if (p.kind === "Time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(o.label))
        throw new Error("Time outcome must use HH:MM");
      p.outcome = option;
      if (p.kind === "Date") m.date = o.label;
      if (p.kind === "Time") m.time = o.label;
      if (p.kind === "Location") m.place = o.label;
      m.invitees.forEach((id) =>
        notify(
          id,
          `Outcome applied: ${p.question} — ${o.label}`,
          m.id,
          `outcome:${p.id}`,
          p.id,
        ),
      );
      return snapshot();
    },
    saveBusy(value) {
      const b = structuredClone(value);
      const old = state.busy.find((x) => x.id === b.id);
      if (b.person !== actor || (old && old.person !== actor))
        throw new Error("You can only edit your own availability");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(b.endDate) ||
        b.endDate < b.date ||
        !!b.start !== !!b.end ||
        (b.start &&
          (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.start) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.end) ||
            b.end <= b.start))
      )
        throw new Error("Choose a valid date range and hours");
      state.busy = old
        ? state.busy.map((x) => (x.id === b.id ? b : x))
        : [...state.busy, b];
      return snapshot();
    },
    removeBusy(id) {
      const b = state.busy.find((x) => x.id === id);
      if (!b || b.person !== actor)
        throw new Error("You can only edit your own availability");
      state.busy = state.busy.filter((x) => x.id !== id);
      return snapshot();
    },
    readNotice(id) {
      const n = state.notifications.find(
        (n) => n.id === id && n.person === actor,
      );
      if (n) n.read = true;
      return snapshot();
    },
    friend(id, accept) {
      if (actor !== "alex")
        throw new Error("Friend requests are an Alex-only demonstration");
      if (!state.requests.includes(id)) throw new Error("Request not found");
      state.requests = state.requests.filter((x) => x !== id);
      if (accept) state.friends = [...new Set([...state.friends, id])];
      return snapshot();
    },
  };
}
export function createSyntheticIdentity(): IdentityAdapter {
  let active = false;
  return {
    current: () => (active ? { id: "synthetic-alex", synthetic: true } : null),
    startSyntheticSession() {
      active = true;
    },
    signOut() {
      active = false;
    },
  };
}
