"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CancelBookingState {
  error?: string;
}

export async function cancelBooking(
  _prevState: CancelBookingState | undefined,
  formData: FormData
): Promise<CancelBookingState> {
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string" || !bookingId) {
    return { error: "Invalid booking." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // RLS already scopes deletes to the row's owner — the `.eq("user_id", …)`
  // here is defense in depth, per the spec, not the actual security boundary.
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Could not cancel the booking. Please try again." };
  }

  revalidatePath("/mina-bokningar");
  return {};
}
