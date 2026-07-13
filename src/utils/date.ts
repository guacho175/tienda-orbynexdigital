import { brandConfig } from "@/config/brand.config";

export const APP_TIME_ZONE = "America/Santiago";

const dateFormatter = new Intl.DateTimeFormat(brandConfig.locale, {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(brandConfig.locale, {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateCL(value: string | Date) {
  return dateFormatter.format(toDate(value));
}

export function formatDateTimeCL(value: string | Date) {
  return dateTimeFormatter.format(toDate(value));
}

export function toChileDateKey(value: string | Date) {
  return dateKeyFormatter.format(toDate(value));
}

export function formatChileDateKey(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function chileDateInputToUtcIso(value: string, boundary: "start" | "end") {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return zonedTimeToUtcIso({
    year,
    month,
    day,
    hour: boundary === "start" ? 0 : 23,
    minute: boundary === "start" ? 0 : 59,
    second: boundary === "start" ? 0 : 59,
    millisecond: boundary === "start" ? 0 : 999,
  });
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function zonedTimeToUtcIso(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  let utcTime = utcGuess - getTimeZoneOffsetMs(new Date(utcGuess));
  utcTime = utcGuess - getTimeZoneOffsetMs(new Date(utcTime));
  return new Date(utcTime).toISOString();
}

function getTimeZoneOffsetMs(date: Date) {
  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    localParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  const localAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return localAsUtc - date.getTime();
}
