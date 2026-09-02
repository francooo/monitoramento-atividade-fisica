import "dotenv/config";

import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { activities, comments, follows, kudos, users } from "./schema";

/**
 * Popula o banco com dados de demonstração — os mesmos números que aparecem
 * no Figma, para que o feed em desenvolvimento seja idêntico ao layout.
 *
 *   npm run db:seed
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida.");

const db = drizzle(neon(url), { casing: "snake_case" });

/** Data de hoje às HH:MM no fuso local do servidor. */
function at(daysAgo: number, hours: number, minutes: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  console.log("Limpando tabelas…");
  await db.delete(comments);
  await db.delete(kudos);
  await db.delete(follows);
  await db.delete(activities);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("dawn1234", 12);

  console.log("Criando usuários…");
  const [andrews, marina, rafa] = await db
    .insert(users)
    .values([
      {
        name: "Andrews Franco",
        email: "andrews@dawn.app",
        passwordHash,
        city: "Porto Alegre",
      },
      {
        name: "Marina Duarte",
        email: "marina@dawn.app",
        passwordHash,
        city: "Porto Alegre",
      },
      {
        name: "Rafael Nunes",
        email: "rafael@dawn.app",
        passwordHash,
        city: "Canoas",
      },
    ])
    .returning({ id: users.id });

  console.log("Criando follows…");
  await db.insert(follows).values([
    { followerId: andrews.id, followingId: marina.id },
    { followerId: andrews.id, followingId: rafa.id },
    { followerId: marina.id, followingId: andrews.id },
  ]);

  console.log("Criando atividades…");
  const inserted = await db
    .insert(activities)
    .values([
      // O card exato do Figma: 8,24 km · 5:29 /km · 45:12.
      {
        userId: andrews.id,
        title: "Corrida matinal",
        kind: "corrida",
        startedAt: at(0, 6, 12),
        distanceMeters: 8240,
        durationSeconds: 2712,
        city: "Porto Alegre",
      },
      // Completa a semana: 4 treinos, 31,2 km, 3h 12 no total.
      {
        userId: andrews.id,
        title: "Rodagem leve",
        kind: "corrida",
        startedAt: at(1, 19, 5),
        distanceMeters: 6400,
        durationSeconds: 2280,
        city: "Porto Alegre",
      },
      {
        userId: andrews.id,
        title: "Tiros na Redenção",
        kind: "corrida",
        startedAt: at(3, 6, 40),
        distanceMeters: 10600,
        durationSeconds: 3360,
        city: "Porto Alegre",
      },
      {
        userId: andrews.id,
        title: "Longão de domingo",
        kind: "corrida",
        startedAt: at(4, 7, 15),
        distanceMeters: 5960,
        durationSeconds: 3168,
        city: "Porto Alegre",
      },
      {
        userId: marina.id,
        title: "Volta no Guaíba",
        kind: "pedal",
        startedAt: at(0, 17, 30),
        distanceMeters: 24800,
        durationSeconds: 4260,
        city: "Porto Alegre",
      },
      {
        userId: rafa.id,
        title: "Caminhada pós-turno",
        kind: "caminhada",
        startedAt: at(1, 21, 10),
        distanceMeters: 4200,
        durationSeconds: 2760,
        city: "Canoas",
      },
    ])
    .returning({ id: activities.id, userId: activities.userId });

  const corridaMatinal = inserted[0];

  console.log("Criando kudos e comentários…");
  await db.insert(kudos).values([
    { activityId: corridaMatinal.id, userId: marina.id },
    { activityId: corridaMatinal.id, userId: rafa.id },
  ]);

  await db.insert(comments).values([
    {
      activityId: corridaMatinal.id,
      userId: marina.id,
      body: "Que ritmo! Bora no longão de domingo?",
    },
    {
      activityId: corridaMatinal.id,
      userId: rafa.id,
      body: "6h da manhã é para poucos.",
    },
  ]);

  console.log("\nPronto. Entre com:");
  console.log("  e-mail: andrews@dawn.app");
  console.log("  senha:  dawn1234");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
