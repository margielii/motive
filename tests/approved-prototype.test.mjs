import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.resolve("wrangler"));
const { build } = require("esbuild");
const bundle = await build({
  entryPoints: ["lib/prototype/adapters.ts"],
  bundle: true,
  format: "esm",
  write: false,
});
const {
  createMockRepository,
  pollResults,
  pollClosed,
  groupAvailability,
  isBusy,
  motiveOnDate,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const option = (id, label) => ({ id, label });
function setup() {
  const r = createMockRepository();
  const p = {
    ...r.snapshot().polls[0],
    id: "edit",
    multiple: true,
    options: [
      option("a", "First"),
      option("b", "Second"),
      option("c", "Third"),
    ],
    ballots: {},
  };
  r.savePoll(p);
  r.cast(p.id, ["a", "b"]);
  r.setActor("sam");
  r.cast(p.id, ["b", "c"]);
  r.setActor("jamie");
  r.cast(p.id, ["c"]);
  r.setActor("alex");
  return { r, p };
}
test("option meaning edits preserve unaffected ballot choices and notify only affected voters", () => {
  const { r, p } = setup();
  const current = r.snapshot().polls.find((x) => x.id === p.id);
  r.savePoll({
    ...current,
    options: [
      option("a", "A completely different meaning"),
      option("b", "Second"),
      option("c", "Third"),
    ],
  });
  let s = r.snapshot(),
    q = s.polls.find((x) => x.id === p.id);
  assert.deepEqual(q.ballots, { alex: ["b"], sam: ["b", "c"], jamie: ["c"] });
  assert.equal(s.notifications.filter((n) => n.pollId === p.id).length, 1);
  r.setActor("sam");
  assert.equal(
    r.snapshot().notifications.filter((n) => n.pollId === p.id).length,
    0,
  );
  r.setActor("jamie");
  assert.equal(
    r.snapshot().notifications.filter((n) => n.pollId === p.id).length,
    0,
  );
});
test("removing a voted option retains unaffected votes, consolidates revote notices and rejects forged counts", () => {
  const { r, p } = setup();
  const current = r.snapshot().polls.find((x) => x.id === p.id);
  r.savePoll({
    ...current,
    options: [option("a", "First"), option("c", "Third")],
    ballots: { alex: ["c", "c"] },
  });
  let q = r.snapshot().polls.find((x) => x.id === p.id);
  assert.deepEqual(q.ballots, { alex: ["a"], sam: ["c"], jamie: ["c"] });
  assert.deepEqual(pollResults(q), { counts: [1, 2], votes: 3, voters: 3 });
  r.savePoll({ ...q, options: [option("a", "Changed"), option("c", "Third")] });
  assert.equal(
    r.snapshot().notifications.filter((n) => n.pollId === p.id).length,
    1,
  );
  r.setActor("sam");
  assert.equal(
    r.snapshot().notifications.filter((n) => n.pollId === p.id).length,
    1,
  );
});
test("poll replacement, multi-choice denominator, zero results, manual/deadline close and explicit outcome", () => {
  const r = createMockRepository();
  const base = r.snapshot().polls[0];
  let p = {
    ...base,
    id: "time",
    kind: "Time",
    options: [option("one", "18:00"), option("two", "19:00")],
    ballots: {},
  };
  r.savePoll(p);
  assert.deepEqual(
    pollResults(r.snapshot().polls.find((x) => x.id === "time")),
    { counts: [0, 0], votes: 0, voters: 0 },
  );
  r.cast("time", ["one"]);
  r.cast("time", ["two"]);
  assert.deepEqual(
    pollResults(r.snapshot().polls.find((x) => x.id === "time")).counts,
    [0, 1],
  );
  assert.throws(() => r.cast("time", ["one", "two"]));
  assert.throws(() => r.cast("time", ["unknown"]));
  assert.throws(() => r.applyOutcome("time", "one"));
  r.closePoll("time");
  assert.throws(() => r.cast("time", ["one"]));
  r.applyOutcome("time", "two");
  assert.equal(r.snapshot().plans.find((x) => x.id === "night").time, "19:00");
  assert.equal(
    r.snapshot().plans.find((x) => x.id === "night").status,
    "Confirmed",
  );
  assert.equal(pollClosed({ ...p, deadline: "2020-01-01T12:00" }), true);
  assert.equal(pollClosed({ ...p, deadline: "" }), false);
  r.savePoll({ ...base, id: "expired", deadline: "2020-01-01T12:00" });
  assert.throws(() => r.cast("expired", ["relaxed"]));
});
test("creator controls, participant suggestions, draft privacy, attendance and cancellation", () => {
  const r = createMockRepository(),
    s = r.snapshot();
  const draft = {
    ...s.plans[0],
    id: "draft",
    draft: true,
    date: "",
    time: "",
    groupId: "",
    invitees: [],
    responses: {},
    status: "Planning",
  };
  r.savePlan(draft);
  r.setActor("sam");
  assert.ok(!r.snapshot().plans.some((x) => x.id === "draft"));
  assert.throws(() => r.savePlan({ ...draft, title: "Stolen" }));
  assert.throws(() => r.closePoll("vibe"));
  assert.throws(() => r.savePoll({ ...s.polls[0], question: "Stolen" }));
  assert.throws(() => r.applyOutcome("vibe", "relaxed"));
  r.suggest("vibe", "New idea");
  assert.equal(r.snapshot().polls[0].options.length, 3);
  r.setActor("alex");
  r.savePoll({ ...r.snapshot().polls[0], suggestions: false });
  r.setActor("sam");
  assert.throws(() => r.suggest("vibe", "Not allowed"));
  r.setActor("alex");
  for (const a of ["Going", "Can't Go", "No Response"])
    assert.equal(
      r.attend("trail", a).plans.find((p) => p.id === "trail").responses.alex,
      a,
    );
  assert.throws(() => r.attend("trail", "Maybe"));
  const trail = r.snapshot().plans.find((p) => p.id === "trail");
  r.savePlan({ ...trail, status: "Cancelled" });
  assert.ok(
    r
      .snapshot()
      .plans.some((p) => p.id === "trail" && p.status === "Cancelled"),
  );
  assert.throws(() => r.attend("trail", "Going"));
});
test("own availability only, date ranges/hours/weekly propagation, authorized group aggregation", () => {
  const r = createMockRepository();
  const b = {
    id: "busy",
    person: "alex",
    date: "2027-01-04",
    endDate: "2027-01-05",
    start: "",
    end: "",
    recurrence: "Weekly",
  };
  r.saveBusy(b);
  assert.equal(isBusy(b, "2027-01-05"), true);
  assert.equal(isBusy(b, "2027-01-11"), true);
  assert.equal(isBusy(b, "2027-01-12"), true);
  assert.equal(isBusy(b, "2027-01-03"), false);
  for (const group of ["weekenders", "table", "outside"])
    assert.equal(
      groupAvailability(r.snapshot(), group, "2027-01-04", "alex").find(
        (x) => x.person.id === "alex",
      ).busy.length,
      1,
    );
  const data = groupAvailability(
    r.snapshot(),
    "weekenders",
    "2027-01-04",
    "alex",
  );
  assert.equal(data.find((x) => x.person.id === "jamie").reported, false);
  r.setActor("sam");
  assert.throws(() => r.saveBusy(b));
  assert.throws(() => r.removeBusy("busy"));
  assert.throws(() =>
    groupAvailability(r.snapshot(), "table", "2027-01-04", "sam"),
  );
  assert.throws(() =>
    r.saveGroup({ ...r.snapshot().groups[0], organizer: "sam" }),
  );
  r.setActor("alex");
  assert.throws(() => r.saveBusy({ ...b, start: "18:00", end: "09:00" }));
  r.removeBusy("busy");
  assert.equal(
    r.snapshot().busy.some((x) => x.id === "busy"),
    false,
  );
});
test("group creation, immutable snapshots, draft publication, role isolation and notice read state", () => {
  const r = createMockRepository();
  const s = r.snapshot();
  r.saveGroup({
    id: "new",
    name: "New friends",
    members: ["alex", "jamie"],
    organizer: "alex",
    emoji: "✳",
    artwork: "blue",
    description: "",
  });
  const p = {
    ...s.plans[0],
    id: "new",
    groupId: "new",
    date: "",
    time: "",
    place: "",
    draft: true,
    status: "Planning",
  };
  r.savePlan(p);
  r.setActor("jamie");
  assert.ok(!r.snapshot().plans.some((p) => p.id === "new"));
  r.setActor("alex");
  r.savePlan({ ...p, draft: false });
  r.setActor("jamie");
  assert.equal(
    r.snapshot().plans.find((p) => p.id === "new").status,
    "Planning",
  );
  const n = r.snapshot().notifications.find((n) => n.planId === "new");
  assert.ok(n && !n.read);
  r.readNotice(n.id);
  assert.equal(
    r.snapshot().notifications.find((x) => x.id === n.id).read,
    true,
  );
  r.setActor("riley");
  assert.ok(!r.snapshot().groups.some((g) => g.id === "new"));
  assert.throws(() => r.attend("new", "Going"));
  assert.throws(() => r.cast("vibe", ["relaxed"]));
});

test("single-choice ties remain undecided; local notices consolidate and preserve chronological order", () => {
  const r = createMockRepository();
  let p = r.snapshot().polls[0];
  assert.deepEqual(pollResults(p).counts, [1, 1]);
  assert.equal(p.outcome, null);
  r.setActor("sam");
  r.attend("night", "Going");
  r.attend("night", "Can't Go");
  r.setActor("alex");
  const notices = r.snapshot().notifications;
  assert.equal(
    notices.filter((n) => n.key === "attendance:night:sam").length,
    1,
  );
  r.savePlan({ ...r.snapshot().plans[0], title: "Updated title" });
  r.setActor("sam");
  const n = r.snapshot().notifications;
  assert.ok(n.length);
  assert.ok(n.every((x) => x.person === "sam"));
});

test("recurring Motive calendar dates share one record without phantom invalid monthly dates", () => {
  const r = createMockRepository();
  const p = {
    ...r.snapshot().plans[0],
    date: "2027-01-31",
    recurrence: "Monthly",
  };
  assert.equal(motiveOnDate(p, "2027-03-31"), true);
  assert.equal(motiveOnDate(p, "2027-02-28"), false);
  assert.equal(
    motiveOnDate({ ...p, recurrence: "Weekly" }, "2027-02-07"),
    true,
  );
  assert.equal(
    motiveOnDate({ ...p, status: "Cancelled" }, "2027-03-31"),
    false,
  );
  assert.equal(motiveOnDate({ ...p, draft: true }, "2027-01-31"), false);
});

test("reference UI settings survive edits without resetting ballots or attendance", () => {
  const r = createMockRepository();
  const original = r.snapshot().plans[0];
  r.attend(original.id, "Can't Go");
  const saved = r
    .savePlan({ ...original, reminder: "1 hour before", title: "Updated" })
    .plans.find((p) => p.id === original.id);
  assert.equal(saved.reminder, "1 hour before");
  assert.equal(saved.responses.alex, "Can't Go");
  const poll = r.snapshot().polls[0];
  r.cast(poll.id, [poll.options[0].id]);
  const withVisibility = r
    .savePoll({ ...poll, resultsBeforeVoting: false })
    .polls.find((p) => p.id === poll.id);
  assert.equal(withVisibility.resultsBeforeVoting, false);
  assert.deepEqual(withVisibility.ballots.alex, [poll.options[0].id]);
  assert.deepEqual(withVisibility.ballots.sam, poll.ballots.sam);
  const suggestion = r
    .suggest(poll.id, "A new option")
    .polls.find((p) => p.id === poll.id)
    .options.at(-1);
  assert.equal(suggestion.suggestedBy, "alex");
});

test("synthetic friend requests validate identity, deduplicate, and remain session-local", () => {
  const r = createMockRepository();
  assert.throws(() => r.requestFriend("unknown.demo"));
  assert.throws(() => r.requestFriend("alex.demo"));
  assert.throws(() => r.requestFriend("sam.demo"));
  r.requestFriend("riley.demo");
  assert.deepEqual(r.requestFriend("RILEY.DEMO").sentRequests, ["riley"]);
  assert.equal(createMockRepository().snapshot().sentRequests, undefined);
  r.setActor("sam");
  assert.throws(() => r.requestFriend("riley.demo"));
});
