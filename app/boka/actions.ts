"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations";

export interface BookingFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createBooking(
  _prevState: BookingFormState | undefined,
  formData: FormData
): Promise<BookingFormState> {
  // Server-side validation — the authoritative check, run regardless of
  // whatever the client already validated.
  const parsed = bookingSchema.safeParse({
    classId: formData.get("classId"),
    trainerId: formData.get("trainerId"),
    bookingDate: formData.get("bookingDate"),
    bookingTime: formData.get("bookingTime"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/boka");
  }

  const { classId, trainerId, bookingDate, bookingTime, note } = parsed.data;

  const row = {
    user_id: user.id,
    class_id: classId,
    trainer_id: trainerId,
    booking_date: bookingDate,
    booking_time: bookingTime,
    note: note || null,
  };

  const { error } = await supabase.from("bookings").insert(row);

  if (error) {
    // Don't swallow the real cause: log everything Supabase/PostgREST gave us,
    // plus exactly what we tried to insert (with the types, since a wrong
    // format for `time`/`date`/`uuid` columns is a common cause).
    console.error("[createBooking] insert into bookings failed");
    console.error("  message:", error.message);
    console.error("  code:   ", error.code);
    console.error("  details:", error.details);
    console.error("  hint:   ", error.hint);
    console.error("  payload:", JSON.stringify(row));
    console.error(
      "  types:  ",
      JSON.stringify(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "null" : typeof v])))
    );

    const generic = "Could not create the booking. Please try again.";
    // In development, show the real cause in the UI too, not just the terminal.
    return {
      error:
        process.env.NODE_ENV !== "production"
          ? `${generic} [dev: ${error.code ?? "no-code"} — ${error.message}]`
          : generic,
    };
  }

  revalidatePath("/mina-bokningar");
  redirect("/mina-bokningar");
}
