import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/** Modalidades suportadas no registro de treino. */
export const activityKind = pgEnum("activity_kind", [
  "corrida",
  "caminhada",
  "pedal",
  "trilha",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    provider: text("provider").notNull().default("password"), // password | google | apple
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("password_reset_token_hash_key").on(t.tokenHash)],
);

/**
 * Uma atividade concluída. Distância em metros e duração em segundos —
 * inteiros, para nunca depender de arredondamento de float. O ritmo é
 * derivado na leitura, não armazenado.
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: activityKind("kind").notNull().default("corrida"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    elevationMeters: integer("elevation_meters").notNull().default(0),
    city: text("city"),
    /** GeoJSON-ish: [[lng, lat], ...]. Nulo quando o treino foi digitado à mão. */
    route: jsonb("route").$type<[number, number][] | null>(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activities_user_started_idx").on(t.userId, t.startedAt.desc()),
    index("activities_started_idx").on(t.startedAt.desc()),
  ],
);

/**
 * Foto do treino — uma por atividade, que é o que o card do feed mostra.
 *
 * Fica em tabela à parte de propósito: o feed lê `activities` a cada request e
 * nunca deve arrastar os bytes da imagem junto. Guardada em base64 numa coluna
 * de texto porque o driver HTTP do Neon transporta tudo como texto, e ali
 * `bytea` viraria hex — 2 bytes por byte, contra 1,33 do base64.
 */
export const activityPhotos = pgTable("activity_photos", {
  activityId: uuid("activity_id")
    .primaryKey()
    .references(() => activities.id, { onDelete: "cascade" }),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  /** Dimensões da imagem já comprimida, para o card reservar espaço sem pulo. */
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const kudos = pgTable(
  "kudos",
  {
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.activityId, t.userId] })],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("comments_activity_idx").on(t.activityId, t.createdAt)],
);

/** Quem segue quem — define o que aparece no feed. */
export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  kudos: many(kudos),
  comments: many(comments),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  photo: one(activityPhotos, {
    fields: [activities.id],
    references: [activityPhotos.activityId],
  }),
  kudos: many(kudos),
  comments: many(comments),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
