export const RED = "#C8102E";
export const RED_DARK = "#9B0C23";
export const RED_SOFT = "#FDECEF";
export const INK = "#1A1A1F";
export const MUTED = "#6B7280";
export const BORDER = "#E5E7EB";
export const GREEN = "#16A34A";
export const GREEN_SOFT = "#E8F7EE";
export const AMBER = "#D97706";
export const AMBER_SOFT = "#FEF3E2";

export const CATEGORIES = [
  "Education",
  "Travel",
  "Emergency",
  "Wedding",
  "Home",
  "Electronics",
  "Healthcare",
  "Vehicle",
  "Festival",
  "Gift",
  "Business",
  "Other",
];

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type PlanState = "ACTIVE" | "COMPLETED" | "ENDED";

export const FREQ_LABEL: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};
export const FREQ_ADV: Record<Frequency, string> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};
export const FREQ_UNIT: Record<Frequency, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
};

export type Plan = {
  id: number;
  productName: string;
  category: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  frequency: Frequency;
  dateKnown: boolean;
  installmentAmount: number;
  totalInstallments: number;
  startDate: string;
  endDate: string;
  description: string | null;
  state: PlanState;
  daysLeft: number;
  daysOver: number;
  progress: number;
  createdAt: string;
};

export type Deposit = {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type Summary = {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  endedPlans: number;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  savedThisMonth: number;
  current: Plan[];
};

// ---------- formatting ----------
export const money = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function fmtDateTime(iso: string) {
  const dt = new Date(iso);
  let h = dt.getHours();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${h}:${mm} ${ap}`;
}

// ---------- date math (same rules as the server) ----------
const DAY = 86400000;

export const utcToday = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};
export const pickedToUTC = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
export const toISO = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const diffDays = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY);
const addMonths = (d: Date, n: number) => {
  const day = d.getUTCDate();
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(
    Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0),
  ).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
};

type CalcOk = {
  ok: true;
  installmentAmount: number;
  periods: number;
  endDate: string;
};
type CalcErr = { ok: false; error: string };

export function computePlan(input: {
  target: number;
  frequency: Frequency;
  dateKnown: boolean;
  targetDate: Date | null;
  installment: number;
}): CalcOk | CalcErr {
  const { target, frequency, dateKnown } = input;
  if (!(target > 0)) return { ok: false, error: "Enter the amount" };

  const today = utcToday();
  let periods: number;
  let inst: number;
  let end: Date;

  if (dateKnown) {
    if (!input.targetDate)
      return { ok: false, error: "Pick the purchase date" };
    const t = pickedToUTC(input.targetDate);
    const days = diffDays(today, t);
    if (days < 1) return { ok: false, error: "Pick a future date" };

    if (frequency === "DAILY") periods = days;
    else if (frequency === "WEEKLY") periods = Math.ceil(days / 7);
    else {
      let m =
        (t.getUTCFullYear() - today.getUTCFullYear()) * 12 +
        (t.getUTCMonth() - today.getUTCMonth());
      if (addMonths(today, m) < t) m++;
      periods = Math.max(1, m);
    }
    inst = Math.ceil((target / periods) * 100) / 100;
    end = t;
  } else {
    inst = input.installment;
    if (!(inst > 0))
      return { ok: false, error: "Enter how much you will save each time" };
    if (inst > target)
      return {
        ok: false,
        error: "Saving amount can't be more than the target",
      };
    periods = Math.ceil(target / inst - 1e-9);
    if (frequency === "DAILY") end = addDays(today, periods);
    else if (frequency === "WEEKLY") end = addDays(today, periods * 7);
    else end = addMonths(today, periods);
  }

  if (periods > 10000)
    return {
      ok: false,
      error: "Plan is too long. Use a closer date or a bigger saving amount",
    };

  return { ok: true, installmentAmount: inst, periods, endDate: toISO(end) };
}
