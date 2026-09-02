import "server-only";

import { and, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";

import { db } from "./index";
import {
  activities,
  activityPhotos,
  comments,
  follows,
  kudos,
  users,
} from "./schema";

const TZ = "America/Sao_Paulo";

export type FeedActivity = {
  id: string;
  title: string;
  kind: "corrida" | "caminhada" | "pedal" | "trilha";
  startedAt: Date;
  distanceMeters: number;
  durationSeconds: number;
  city: string | null;
  route: [number, number][] | null;
  authorId: string;
  authorName: string;
  kudosCount: number;
  commentsCount: number;
  likedByMe: boolean;
  /** Só o sinal: os bytes da foto vêm por `/api/atividades/[id]/foto`. */
  hasPhoto: boolean;
};

/**
 * Feed: as atividades do próprio usuário e de quem ele segue, mais recentes
 * primeiro. Contagens vêm de subqueries correlacionadas para manter uma ida
 * só ao banco — importante no driver HTTP do Neon, onde cada query é um
 * round-trip separado.
 */
export async function getFeed(
  userId: string,
  { limit = 20, offset = 0 } = {},
): Promise<FeedActivity[]> {
  const following = db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      kind: activities.kind,
      startedAt: activities.startedAt,
      distanceMeters: activities.distanceMeters,
      durationSeconds: activities.durationSeconds,
      city: activities.city,
      route: activities.route,
      authorId: users.id,
      authorName: users.name,
      kudosCount: sql<number>`(
        select count(*)::int from ${kudos} where ${kudos.activityId} = ${activities.id}
      )`.as("kudos_count"),
      commentsCount: sql<number>`(
        select count(*)::int from ${comments} where ${comments.activityId} = ${activities.id}
      )`.as("comments_count"),
      likedByMe: sql<boolean>`exists (
        select 1 from ${kudos}
        where ${kudos.activityId} = ${activities.id} and ${kudos.userId} = ${userId}
      )`.as("liked_by_me"),
      hasPhoto: sql<boolean>`exists (
        select 1 from ${activityPhotos}
        where ${activityPhotos.activityId} = ${activities.id}
      )`.as("has_photo"),
    })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.userId))
    .where(
      or(eq(activities.userId, userId), inArray(activities.userId, following)),
    )
    .orderBy(desc(activities.startedAt))
    .limit(limit)
    .offset(offset);

  return rows as FeedActivity[];
}

export type WeekSummary = {
  workouts: number;
  distanceMeters: number;
  durationSeconds: number;
  /** Segunda a domingo. Distância por dia, em metros. */
  perDayMeters: number[];
};

/** Início da semana corrente (segunda-feira, 00:00, horário de Brasília). */
export function startOfWeek(now = new Date()): Date {
  const local = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now) + "T00:00:00",
  );
  const dow = (local.getDay() + 6) % 7; // 0 = segunda
  local.setDate(local.getDate() - dow);
  return local;
}

export async function getWeekSummary(
  userId: string,
  now = new Date(),
): Promise<WeekSummary> {
  const from = startOfWeek(now);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);

  const rows = await db
    .select({
      dow: sql<number>`((extract(isodow from ${activities.startedAt} at time zone ${sql.raw(
        `'${TZ}'`,
      )}))::int - 1)`.as("dow"),
      distance: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)::int`.as(
        "distance",
      ),
      duration: sql<number>`coalesce(sum(${activities.durationSeconds}), 0)::int`.as(
        "duration",
      ),
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.startedAt, from),
        lt(activities.startedAt, to),
      ),
    )
    .groupBy(sql`1`);

  const perDayMeters = Array<number>(7).fill(0);
  let workouts = 0;
  let distanceMeters = 0;
  let durationSeconds = 0;

  for (const row of rows) {
    perDayMeters[row.dow] = row.distance;
    workouts += row.count;
    distanceMeters += row.distance;
    durationSeconds += row.duration;
  }

  return { workouts, distanceMeters, durationSeconds, perDayMeters };
}

export async function createActivity(input: {
  userId: string;
  title: string;
  kind: "corrida" | "caminhada" | "pedal" | "trilha";
  distanceMeters: number;
  durationSeconds: number;
  startedAt: Date;
  city: string | null;
  notes: string | null;
}) {
  const [row] = await db.insert(activities).values(input).returning({
    id: activities.id,
  });
  return row;
}

export async function saveActivityPhoto(input: {
  activityId: string;
  mimeType: string;
  data: string;
  width: number;
  height: number;
  byteSize: number;
}) {
  await db
    .insert(activityPhotos)
    .values(input)
    .onConflictDoUpdate({
      target: activityPhotos.activityId,
      set: {
        mimeType: input.mimeType,
        data: input.data,
        width: input.width,
        height: input.height,
        byteSize: input.byteSize,
      },
    });
}

/**
 * Foto de um treino, para quem tem direito de vê-la: o dono ou quem o segue —
 * a mesma regra do feed. A autorização vai na própria cláusula `where` para
 * resolver em uma ida ao banco, e para não existir caminho que leia a imagem
 * sem passá-la.
 */
export async function getActivityPhotoForViewer(
  activityId: string,
  viewerId: string,
) {
  const [row] = await db
    .select({
      mimeType: activityPhotos.mimeType,
      data: activityPhotos.data,
    })
    .from(activityPhotos)
    .innerJoin(activities, eq(activities.id, activityPhotos.activityId))
    .where(
      and(
        eq(activityPhotos.activityId, activityId),
        or(
          eq(activities.userId, viewerId),
          sql`exists (
            select 1 from ${follows}
            where ${follows.followerId} = ${viewerId}
              and ${follows.followingId} = ${activities.userId}
          )`,
        ),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Curtir / descurtir. Devolve o estado final para a UI. */
export async function toggleKudos(activityId: string, userId: string) {
  const existing = await db
    .select({ userId: kudos.userId })
    .from(kudos)
    .where(and(eq(kudos.activityId, activityId), eq(kudos.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(kudos)
      .where(and(eq(kudos.activityId, activityId), eq(kudos.userId, userId)));
    return { liked: false };
  }

  await db.insert(kudos).values({ activityId, userId }).onConflictDoNothing();
  return { liked: true };
}

export async function getProfileTotals(userId: string) {
  const [row] = await db
    .select({
      workouts: sql<number>`count(*)::int`,
      distance: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)::int`,
      duration: sql<number>`coalesce(sum(${activities.durationSeconds}), 0)::int`,
    })
    .from(activities)
    .where(eq(activities.userId, userId));

  return row ?? { workouts: 0, distance: 0, duration: 0 };
}

export async function getActivitiesWithRoute(userId: string, limit = 30) {
  return db
    .select({
      id: activities.id,
      title: activities.title,
      startedAt: activities.startedAt,
      distanceMeters: activities.distanceMeters,
      durationSeconds: activities.durationSeconds,
      city: activities.city,
      route: activities.route,
    })
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.startedAt))
    .limit(limit);
}
