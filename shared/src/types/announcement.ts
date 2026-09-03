// shared/src/types/announcement.ts
import { Schema } from "effect";

export class Announcement extends Schema.Class<Announcement>("Announcement")({
  id: Schema.String,
  class_id: Schema.String,
  teacher_id: Schema.String,
  title: Schema.String,
  content: Schema.String,
  created_at: Schema.String,
  expires_at: Schema.NullOr(Schema.String),
}) {}

export class AnnouncementInput extends Schema.Class<AnnouncementInput>("AnnouncementInput")({
  class_id: Schema.String,
  teacher_id: Schema.optional(Schema.String),
  title: Schema.String,
  content: Schema.String,
  expires_at: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export const AnnouncementSchema = AnnouncementInput;

export interface AnnouncementListResponse {
  data: Announcement[];
  count: number;
}

export interface AnnouncementResponse {
  data: Announcement;
}
