export type Attendance = "Going" | "Maybe" | "Not going";
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
};
export type Group = {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  description: string;
};
export type Profile = { name: string; bio: string; avatar: string };
export type Snapshot = { plans: Plan[]; groups: Group[]; profile: Profile };
// This interface is the replacement seam for an authorized D1-backed API.
export interface PlanRepository {
  snapshot(): Snapshot;
  savePlan(plan: Plan): Snapshot;
  attend(id: string, value: Attendance): Snapshot;
  vote(id: string, option: number): Snapshot;
  profile(value: Profile): Snapshot;
  reset(): Snapshot;
}
export interface IdentityAdapter {
  current(): { id: string; synthetic: true } | null;
  startSyntheticSession(): void;
  signOut(): void;
}
