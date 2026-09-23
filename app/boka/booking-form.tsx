"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { createBooking, type BookingFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassRow, TrainerRow } from "@/lib/queries";

const initialState: BookingFormState = {};

// The date and time pickers below are deliberately NOT native
// <input type="date|time">. Browsers format those from the user's OS/browser
// language (Swedish "åååå-mm-dd"), and the `lang` attribute doesn't change
// that, so an English-only site can't control it. These render English text
// regardless of system locale and open from anywhere on the field.
const LOCALE = "en-US";

function toISODate(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

function fromISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Half-hour slots across opening hours, submitted as "HH:MM" (what the server
// schema expects) and labelled "6:00 AM" for display.
const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h24 = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    value: `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    label: `${h12}:${String(min).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`,
  };
});

export function BookingForm({ classes, trainers }: { classes: ClassRow[]; trainers: TrainerRow[] }) {
  const [state, formAction, pending] = useActionState(createBooking, initialState);

  // Controlled fields: React 19 resets uncontrolled inputs after a form action
  // completes, so a server-side validation error on one field (say, the note
  // being too long) would otherwise wipe the class, trainer, date and time too.
  const [values, setValues] = useState({
    classId: null as string | null,
    trainerId: null as string | null,
    bookingDate: "",
    bookingTime: null as string | null,
    note: "",
  });
  const [dateOpen, setDateOpen] = useState(false);

  // `items` is what lets <SelectValue> show the selected option's label; without
  // it Base UI falls back to rendering the raw value (the uuid).
  const classItems = useMemo(() => classes.map((c) => ({ value: c.id, label: c.name })), [classes]);
  const trainerItems = useMemo(() => trainers.map((t) => ({ value: t.id, label: t.name })), [trainers]);

  const selectedDate = values.bookingDate ? fromISODate(values.bookingDate) : undefined;

  return (
    <form action={formAction} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="classId">Class</Label>
          <Select
            name="classId"
            required
            items={classItems}
            disabled={classes.length === 0}
            value={values.classId}
            onValueChange={(value) => setValues((prev) => ({ ...prev, classId: value }))}
          >
            <SelectTrigger id="classId" className="w-full">
              <SelectValue placeholder={classes.length ? "Select a class" : "No classes available"} />
            </SelectTrigger>
            <SelectContent>
              {classItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.classId?.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="trainerId">Trainer</Label>
          <Select
            name="trainerId"
            required
            items={trainerItems}
            disabled={trainers.length === 0}
            value={values.trainerId}
            onValueChange={(value) => setValues((prev) => ({ ...prev, trainerId: value }))}
          >
            <SelectTrigger id="trainerId" className="w-full">
              <SelectValue placeholder={trainers.length ? "Select a trainer" : "No trainers available"} />
            </SelectTrigger>
            <SelectContent>
              {trainerItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.trainerId?.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bookingDate">Date</Label>
          <input type="hidden" name="bookingDate" value={values.bookingDate} />
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            {/* The whole field is the trigger, so a click anywhere on it opens the calendar. */}
            <PopoverTrigger
              id="bookingDate"
              aria-invalid={!!state.fieldErrors?.bookingDate}
              className="flex h-8 w-full items-center justify-between gap-2 rounded-none border border-input bg-transparent px-2.5 text-left text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
            >
              <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
                {selectedDate
                  ? selectedDate.toLocaleDateString(LOCALE, {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Select a date"}
              </span>
              <CalendarBlankIcon className="size-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                defaultMonth={selectedDate}
                disabled={{ before: startOfToday() }}
                onSelect={(date) => {
                  if (date) {
                    setValues((prev) => ({ ...prev, bookingDate: toISODate(date) }));
                    setDateOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {state.fieldErrors?.bookingDate?.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bookingTime">Time</Label>
          <Select
            name="bookingTime"
            required
            items={TIME_SLOTS}
            value={values.bookingTime}
            onValueChange={(value) => setValues((prev) => ({ ...prev, bookingTime: value }))}
          >
            <SelectTrigger id="bookingTime" className="w-full">
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.bookingTime?.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Message (optional)</Label>
        <Textarea
          id="note"
          name="note"
          maxLength={500}
          placeholder="Anything we should know before your session?"
          value={values.note}
          onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
          aria-invalid={!!state.fieldErrors?.note}
        />
        {/* Limit shown up front, not only after a failed submit. */}
        <p className="text-[11px] text-muted-foreground">{values.note.length}/500 characters</p>
        {state.fieldErrors?.note?.map((error) => (
          <p key={error} className="text-xs text-destructive">
            {error}
          </p>
        ))}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
        {pending ? "Booking…" : "Book session"}
      </Button>
    </form>
  );
}
