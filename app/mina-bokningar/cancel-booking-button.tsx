"use client";

import { useActionState } from "react";
import { cancelBooking, type CancelBookingState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: CancelBookingState = {};

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(cancelBooking, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
