import assert from "node:assert/strict";
import { digestRequest, overdueCount } from "./digest.ts";
const input = digestRequest.parse({ course: "Algebra", educator: "Dr. Lin", subscribers: ["learner@example.com"], deadlines: [{ learner: "Ari", title: "Quiz", due: "2026-09-12" }, { learner: "Bo", title: "Lab", due: "2026-09-20" }] });
assert.equal(overdueCount(input, "2026-09-13"), 1);
console.log("overdue decision: 1");
