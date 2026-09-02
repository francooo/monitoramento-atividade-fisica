"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createActivity, saveActivityPhoto, toggleKudos } from "@/db/queries";
import { requireUser } from "@/lib/session";
import {
  activitySchema,
  parseDecimal,
  parsePhotoDataUrl,
  parsePhotoDimension,
} from "@/lib/validation";

export type ActivityState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveActivity(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
  const user = await requireUser();

  const parsed = activitySchema.safeParse({
    title: formData.get("title"),
    kind: formData.get("kind"),
    distanceKm: parseDecimal(formData.get("distanceKm")),
    durationMinutes: parseDecimal(formData.get("durationMinutes")),
    startedAt: formData.get("startedAt"),
    city: formData.get("city"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Antes de gravar o treino: uma foto recusada aqui não deve deixar para trás
  // uma atividade meio salva.
  const { photo, error: photoError } = parsePhotoDataUrl(formData.get("photo"));
  if (photoError) return { fieldErrors: { photo: photoError } };

  const activity = await createActivity({
    userId: user.id,
    title: parsed.data.title,
    kind: parsed.data.kind,
    distanceMeters: Math.round(parsed.data.distanceKm * 1000),
    durationSeconds: Math.round(parsed.data.durationMinutes * 60),
    startedAt: parsed.data.startedAt,
    city: parsed.data.city?.trim() || user.city || null,
    notes: parsed.data.notes?.trim() || null,
  });

  if (photo) {
    await saveActivityPhoto({
      activityId: activity.id,
      mimeType: photo.mimeType,
      data: photo.data,
      width: parsePhotoDimension(formData.get("photoWidth")),
      height: parsePhotoDimension(formData.get("photoHeight")),
      byteSize: photo.byteSize,
    });
  }

  revalidatePath("/feed");
  revalidatePath("/progresso");
  redirect("/feed");
}

export async function likeActivity(activityId: string) {
  const user = await requireUser();
  const result = await toggleKudos(activityId, user.id);
  revalidatePath("/feed");
  return result;
}
