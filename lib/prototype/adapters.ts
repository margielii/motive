import type { IdentityAdapter, Plan, PlanRepository, Snapshot } from "./model";
function seed(): Snapshot {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  return {
    profile: { name: "Alex", bio: "Good people. Great plans.", avatar: "A" },
    groups: [
      {
        id: "weekenders",
        name: "The Weekenders",
        emoji: "✺",
        members: ["Alex", "Sam", "Jamie", "Riley", "Morgan"],
        description: "Our little escape from the everyday.",
      },
      {
        id: "table",
        name: "At the Table",
        emoji: "◒",
        members: ["Alex", "Charlie", "Drew"],
        description: "New places, familiar faces.",
      },
      {
        id: "outside",
        name: "Outside Club",
        emoji: "↗",
        members: ["Alex", "Sam", "Taylor", "Jo"],
        description: "A little fresh air goes a long way.",
      },
    ],
    plans: [
      {
        id: "night",
        title: "A night above it all",
        groupId: "weekenders",
        date: day(1),
        time: "19:30",
        place: "The rooftop · Downtown",
        description:
          "City lights, a slow sunset, and absolutely no rush. Meet upstairs.",
        attendance: "Going",
        votes: [3, 1],
        vote: null,
      },
      {
        id: "dinner",
        title: "One more course",
        groupId: "table",
        date: day(3),
        time: "18:00",
        place: "Little Italy",
        description: "A table for the crew. Bring an appetite.",
        attendance: "Maybe",
        votes: [1, 2],
        vote: null,
      },
      {
        id: "trail",
        title: "Take the scenic route",
        groupId: "outside",
        date: day(6),
        time: "09:00",
        place: "North trailhead",
        description: "Easy miles, coffee after. Bring water and a warm layer.",
        attendance: "Going",
        votes: [2, 1],
        vote: null,
      },
    ],
  };
}
// In-memory only: never localStorage, cookies, fetch, D1 or a shared service.
export function createMockRepository(): PlanRepository {
  let state = seed();
  const snapshot = () => structuredClone(state);
  const update = (id: string, fn: (p: Plan) => Plan) => {
    state.plans = state.plans.map((p) => (p.id === id ? fn(p) : p));
    return snapshot();
  };
  return {
    snapshot,
    savePlan(plan) {
      if (!state.groups.some((g) => g.id === plan.groupId))
        throw new Error("Choose a private group");
      if (
        !plan.title.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(plan.date) ||
        !/^\d{2}:\d{2}$/.test(plan.time)
      )
        throw new Error("Complete the plan details");
      const existing = state.plans.some((p) => p.id === plan.id);
      state.plans = existing
        ? state.plans.map((p) => (p.id === plan.id ? structuredClone(plan) : p))
        : [...state.plans, structuredClone(plan)];
      return snapshot();
    },
    attend: (id, attendance) => update(id, (p) => ({ ...p, attendance })),
    vote(id, option) {
      if (option !== 0 && option !== 1) throw new Error("Invalid option");
      return update(id, (p) => {
        const votes: [number, number] = [...p.votes];
        if (p.vote !== null) votes[p.vote]--;
        votes[option]++;
        return { ...p, votes, vote: option };
      });
    },
    profile(profile) {
      state.profile = { ...profile };
      return snapshot();
    },
    reset() {
      state = seed();
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
