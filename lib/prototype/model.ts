export type Attendance = "Going" | "Can't Go" | "No Response";
export type Person = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};
export type PollOption = { id: string; label: string };
export type Poll = {
  id: string;
  planId: string;
  creator: string;
  question: string;
  kind: "Date" | "Time" | "Location" | "General Choice";
  multiple: boolean;
  suggestions: boolean;
  deadline: string;
  closed: boolean;
  options: PollOption[];
  ballots: Record<string, string[]>;
  outcome: string | null;
};
export type Plan = {
  id: string;
  title: string;
  groupId: string;
  date: string;
  time: string;
  place: string;
  description: string;
  attendance: Attendance;
  votes: [number, number];
  vote: number | null;
  organizer: string;
  invitees: string[];
  responses: Record<string, Attendance>;
  status: "Planning" | "Confirmed" | "Cancelled";
  draft: boolean;
  category: string;
  recurrence: string;
  artwork: string;
  kind: "Motive" | "Event";
};
export type Group = {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  description: string;
  organizer: string;
  artwork: string;
};
export type Profile = { name: string; avatar: string };
export type Busy = {
  id: string;
  person: string;
  date: string;
  endDate: string;
  start: string;
  end: string;
  recurrence: "None" | "Weekly";
};
export type Notice = {
  id: string;
  person: string;
  text: string;
  planId: string;
  pollId?: string;
  at: number;
  read: boolean;
  key: string;
};
export type Snapshot = {
  plans: Plan[];
  groups: Group[];
  profile: Profile;
  people: Person[];
  polls: Poll[];
  busy: Busy[];
  notifications: Notice[];
  friends: string[];
  requests: string[];
};
export interface PlanRepository {
  snapshot(): Snapshot;
  savePlan(plan: Plan): Snapshot;
  attend(id: string, value: Attendance): Snapshot;
  vote(id: string, option: number): Snapshot;
  profile(value: Profile): Snapshot;
  reset(): Snapshot;
  setActor(id: string): void;
  saveGroup(group: Group): Snapshot;
  savePoll(poll: Poll): Snapshot;
  cast(pollId: string, options: string[]): Snapshot;
  suggest(pollId: string, label: string): Snapshot;
  closePoll(id: string): Snapshot;
  applyOutcome(id: string, option: string): Snapshot;
  saveBusy(busy: Busy): Snapshot;
  removeBusy(id: string): Snapshot;
  readNotice(id: string): Snapshot;
  friend(id: string, accept: boolean): Snapshot;
}
export interface IdentityAdapter {
  current(): { id: string; synthetic: true } | null;
  startSyntheticSession(): void;
  signOut(): void;
}
