import { BackHeader } from "@/components/ui/back-header";
import { requireUser } from "@/lib/session";

import { ActivityForm } from "./activity-form";

export const metadata = { title: "Registrar treino · Dawn" };

/**
 * Tela nova, não presente no Figma: o botão central da tab bar precisava de
 * um destino. Segue os mesmos tokens das telas de autenticação (campo #F5F5F6,
 * raio 12, botão pílula laranja) para não destoar do resto.
 */
export default async function NovaAtividadePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <BackHeader href="/feed" label="Voltar para o início" />

      <div className="flex w-full flex-1 flex-col px-[24px] pt-[18px]">
        <h1 className="text-[30px] font-extrabold tracking-[-0.6px] text-ink">
          Registrar treino
        </h1>
        <p className="w-full text-[15px] font-medium text-muted">
          Distância e tempo bastam — o ritmo é calculado.
        </p>

        <div className="h-[24px]" />

        <ActivityForm defaultCity={user.city ?? ""} />
      </div>
    </div>
  );
}
