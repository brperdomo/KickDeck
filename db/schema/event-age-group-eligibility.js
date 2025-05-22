import { pgTable, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { eventAgeGroups, events } from "./index.js";

/**
 * Event Age Group Eligibility
 * 
 * This table stores the eligibility settings for age groups within events.
 * It's separate from event_age_groups to avoid foreign key constraints with brackets.
 */
export const eventAgeGroupEligibility = pgTable(
  "event_age_group_eligibility",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    ageGroupId: integer("age_group_id")
      .notNull()
      .references(() => eventAgeGroups.id),
    isEligible: boolean("is_eligible").notNull().default(true)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.eventId, table.ageGroupId] })
    };
  }
);