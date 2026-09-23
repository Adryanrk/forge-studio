import { createClient } from "@/lib/supabase/server";

export interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  trainer_id: string | null;
}

export interface TrainerRow {
  id: string;
  name: string;
  specialty: string | null;
  photo_url: string | null;
}

export interface BookingRow {
  id: string;
  user_id: string;
  class_id: string | null;
  trainer_id: string | null;
  booking_date: string;
  booking_time: string;
  note: string | null;
  created_at: string;
}

export interface BookingWithRelations extends BookingRow {
  classes: { id: string; name: string } | null;
  trainers: { id: string; name: string } | null;
}

export async function getClasses(): Promise<ClassRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, description, trainer_id")
    .order("name");

  if (error) {
    console.error("getClasses failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTrainers(): Promise<TrainerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select("id, name, specialty, photo_url")
    .order("name");

  if (error) {
    console.error("getTrainers failed:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * RLS already restricts `bookings` rows to their owner, but we still filter
 * by `userId` explicitly (defense in depth, per the spec).
 */
export async function getUserBookings(userId: string): Promise<BookingWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, classes(id, name), trainers(id, name)")
    .eq("user_id", userId)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (error) {
    console.error("getUserBookings failed:", error.message);
    return [];
  }
  return (data as BookingWithRelations[] | null) ?? [];
}
