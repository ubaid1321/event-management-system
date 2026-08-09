/**
 * Database types matching the SQL in supabase/migrations/.
 *
 * Hand-maintained. If you change the schema, either update this file or
 * regenerate it:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *
 * Note: every row shape below is a `type`, not an `interface`. postgrest-js
 * constrains tables to `Record<string, unknown>`, and only type aliases get the
 * implicit index signature that satisfies it — an interface here silently
 * degrades every query result to `never`.
 */

export type EventStatus = "planning" | "open" | "live" | "closed" | "archived";

export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "waitlisted"
  | "cancelled";

export type UserRole = "admin" | "member";

export type Department =
  | "content"
  | "design"
  | "analyst"
  | "developer"
  | "marketing";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "done";

export type TaskPriority = "low" | "normal" | "high";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  department: Department | null;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  ticket_price_cents: number;
  currency: string;
  website_url: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationRow = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  role_title: string | null;
  country: string | null;
  ticket_type: string;
  status: RegistrationStatus;
  amount_paid_cents: number;
  checked_in_at: string | null;
  notes: string | null;
  registered_at: string;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  department: Department;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string | null;
  reviewer_id: string | null;
  due_on: string | null;
  deliverable_url: string | null;
  deliverable_label: string | null;
  completed_at: string | null;
  completed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

/** Columns that accept NULL — Postgres defaults them, so they're optional. */
type NullableKeys<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

/**
 * Insert shape: columns the database fills in for you (defaults, generated
 * ids, timestamps) and columns that accept NULL are both optional.
 */
type Insert<T, Generated extends keyof T> = Omit<
  T,
  Generated | NullableKeys<T>
> & {
  [K in Generated | NullableKeys<T>]?: T[K];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<
          ProfileRow,
          "role" | "is_active" | "created_at" | "updated_at"
        >;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insert<
          EventRow,
          | "id"
          | "status"
          | "timezone"
          | "ticket_price_cents"
          | "currency"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      registrations: {
        Row: RegistrationRow;
        Insert: Insert<
          RegistrationRow,
          | "id"
          | "ticket_type"
          | "status"
          | "amount_paid_cents"
          | "registered_at"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<RegistrationRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Insert<
          TaskRow,
          | "id"
          | "department"
          | "status"
          | "priority"
          | "completed_at"
          | "completed_by"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
