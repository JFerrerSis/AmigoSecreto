import { describe, expect, it } from "bun:test";

import { buildDraw, DrawError, type DrawMember } from "./draw";

const members = (ids: string[]): DrawMember[] =>
  ids.map((user_id) => ({ user_id, full_name: user_id }));

function expectValidDraw(
  givers: DrawMember[],
  pairs: ReturnType<typeof buildDraw>,
  exclusions: { user_id_1: string; user_id_2: string }[] = [],
) {
  expect(pairs).toHaveLength(givers.length);
  expect(new Set(pairs.map((pair) => pair.giver_id)).size).toBe(
    givers.length,
  );
  expect(new Set(pairs.map((pair) => pair.receiver_id)).size).toBe(
    givers.length,
  );

  const blocked = new Set(
    exclusions.map((exclusion) =>
      [exclusion.user_id_1, exclusion.user_id_2].sort().join("::"),
    ),
  );

  for (const pair of pairs) {
    expect(pair.giver_id).not.toBe(pair.receiver_id);
    expect(
      blocked.has([pair.giver_id, pair.receiver_id].sort().join("::")),
    ).toBe(false);
  }
}

describe("buildDraw", () => {
  it("creates a valid derangement", () => {
    const givers = members(["a", "b", "c", "d", "e"]);
    expectValidDraw(givers, buildDraw(givers, []));
  });

  it("respects mutual exclusions", () => {
    const givers = members(["a", "b", "c", "d"]);
    const exclusions = [
      { user_id_1: "a", user_id_2: "b" },
      { user_id_1: "c", user_id_2: "d" },
    ];

    expectValidDraw(givers, buildDraw(givers, exclusions), exclusions);
  });

  it("treats a reversed exclusion as bidirectional", () => {
    const givers = members(["a", "b", "c", "d"]);
    const exclusions = [{ user_id_1: "b", user_id_2: "a" }];
    const pairs = buildDraw(givers, exclusions);

    expectValidDraw(givers, pairs, exclusions);
    expect(
      pairs.some(
        (pair) =>
          (pair.giver_id === "a" && pair.receiver_id === "b") ||
          (pair.giver_id === "b" && pair.receiver_id === "a"),
      ),
    ).toBe(false);
  });

  it("is randomized across runs", () => {
    const givers = members(["a", "b", "c", "d"]);
    const signatures = new Set<string>();

    for (let index = 0; index < 60; index += 1) {
      signatures.add(
        buildDraw(givers, [])
          .map((pair) => `${pair.giver_id}>${pair.receiver_id}`)
          .join("|"),
      );
    }

    expect(signatures.size).toBeGreaterThan(1);
  });

  it("rejects an impossible two-person exclusion", () => {
    const givers = members(["a", "b"]);

    expect(() =>
      buildDraw(givers, [{ user_id_1: "a", user_id_2: "b" }]),
    ).toThrow(DrawError);
  });

  it("rejects a member with no possible receivers", () => {
    const givers = members(["a", "b", "c"]);

    expect(() =>
      buildDraw(givers, [
        { user_id_1: "a", user_id_2: "b" },
        { user_id_1: "a", user_id_2: "c" },
      ]),
    ).toThrow(DrawError);
  });

  it("rejects duplicate or insufficient members", () => {
    expect(() => buildDraw([], [])).toThrow(DrawError);
    expect(() =>
      buildDraw(members(["a", "a"]), []),
    ).toThrow(DrawError);
  });
});
