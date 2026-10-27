/**
 * A tiny in-memory stand-in for the parts of Prisma the routes use. It
 * supports equality filters, `not`, `lt/lte/gt/gte/in`, orderBy, `select` and
 * the handful of methods called by the code under test. `include` is ignored.
 * It is for tests only.
 */
function matches(row, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond && typeof cond === "object" && !(cond instanceof Date)) {
      return Object.entries(cond).every(([op, expected]) => {
        switch (op) {
          case "not": return value !== expected;
          case "lt": return value < expected;
          case "lte": return value <= expected;
          case "gt": return value > expected;
          case "gte": return value >= expected;
          case "in": return expected.includes(value);
          default: return true; // unsupported operators are ignored on purpose
        }
      });
    }
    return value === cond;
  });
}

// Real Prisma returns independent snapshots: later updates must not change an
// object the caller already holds. Returning copies keeps the fake faithful.
const copy = (row) => (row ? { ...row } : row);

function table(defaults = () => ({})) {
  let seq = 0;
  const rows = [];
  return {
    rows,
    async findUnique({ where }) {
      return copy(rows.find((r) => matches(r, where)) ?? null);
    },
    async findFirst({ where }) {
      return copy(rows.find((r) => matches(r, where)) ?? null);
    },
    async findMany({ where, orderBy, select, take } = {}) {
      let out = rows.filter((r) => matches(r, where)).map(copy);
      if (orderBy) {
        const [[key, dir]] = Object.entries(orderBy);
        out = [...out].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (dir === "desc" ? -1 : 1));
      }
      if (take) out = out.slice(0, take);
      if (select) out = out.map((r) => Object.fromEntries(Object.keys(select).map((k) => [k, r[k]])));
      return out;
    },
    async count({ where } = {}) {
      return rows.filter((r) => matches(r, where)).length;
    },
    async create({ data }) {
      const row = { id: `id${++seq}`, createdAt: new Date(Date.now() + seq), ...defaults(), ...data };
      rows.push(row);
      return copy(row);
    },
    async update({ where, data }) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error("Record not found");
      Object.assign(row, data);
      return copy(row);
    },
    async updateMany({ where, data }) {
      const hit = rows.filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    async delete({ where }) {
      const i = rows.findIndex((r) => matches(r, where));
      if (i < 0) throw new Error("Record not found");
      return rows.splice(i, 1)[0];
    },
    async deleteMany({ where }) {
      const keep = rows.filter((r) => !matches(r, where));
      const count = rows.length - keep.length;
      rows.splice(0, rows.length, ...keep);
      return { count };
    },
  };
}

export function createFakePrisma() {
  const prisma = {
    company: table(() => ({
      subscriptionStatus: "trialing",
      vertical: "trucking",
      emailVerified: true,
      reminderOffsets: "30,15,7,1",
      reminderEmails: "",
      notifyDrivers: false,
      weeklyDigest: true,
      contactName: null,
      phone: null,
      country: null,
      usdot: null,
      planEndsAt: null,
      planRenewsAt: null,
      lsPortalUrl: null,
    })),
    teamMember: table(() => ({ role: "viewer", passwordHash: "" })),
    vehicle: table(() => ({ type: "truck", status: "active" })),
    driver: table(() => ({ status: "active" })),
    document: table(() => ({ fileName: null, vehicleId: null, driverId: null, sentReminders: "", currency: "USD" })),
  };

  // Deleting a parent removes what belongs to it, like the real cascades.
  const cascade = (parent, children) => {
    const original = prisma[parent].delete;
    prisma[parent].delete = async (args) => {
      const row = await original(args);
      for (const [child, foreignKey] of children) await prisma[child].deleteMany({ where: { [foreignKey]: row.id } });
      return row;
    };
  };
  cascade("company", [["teamMember", "companyId"], ["document", "companyId"], ["vehicle", "companyId"], ["driver", "companyId"]]);
  cascade("vehicle", [["document", "vehicleId"]]);
  cascade("driver", [["document", "driverId"]]);
  return prisma;
}
