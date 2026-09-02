import { getActivityPhotoForViewer } from "@/db/queries";
import { getCurrentUser } from "@/lib/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serve a foto de um treino. Os bytes moram no banco (ver `activity_photos`),
 * então esta rota é o único caminho até eles — e por isso é ela que autoriza:
 * sem sessão, 401; sem direito de ver aquele treino, 404, que não distingue
 * "não existe" de "não é para você".
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/atividades/[id]/foto">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { id } = await ctx.params;
  // O id vai direto para uma coluna uuid; texto qualquer faria o Postgres
  // estourar em vez de devolver vazio.
  if (!UUID.test(id)) return new Response("Não encontrada", { status: 404 });

  const photo = await getActivityPhotoForViewer(id, user.id);
  if (!photo) return new Response("Não encontrada", { status: 404 });

  const bytes = Buffer.from(photo.data, "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(bytes.byteLength),
      // A foto de um treino não muda depois de salva, daí `immutable`.
      // `private` porque a resposta depende de quem está pedindo — nenhum
      // cache compartilhado deve guardá-la.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
