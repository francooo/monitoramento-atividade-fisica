"use client";

import { useRef, useState } from "react";

import { MAX_PHOTO_BASE64_LENGTH } from "@/lib/validation";

/**
 * Maior lado da imagem depois de reduzida. O card do feed tem 362px de
 * largura; 1280 dá margem para telas densas sem levar os 4000px que a câmera
 * de um celular produz para dentro do banco.
 */
const MAX_EDGE = 1280;

/**
 * Alvo do arquivo comprimido, em caracteres de base64 (~300KB de imagem).
 * Fica bem abaixo do teto do servidor porque o resto do formulário viaja no
 * mesmo corpo de 1MB da Server Action.
 */
const TARGET_LENGTH = 400_000;

const QUALITIES = [0.75, 0.6, 0.45, 0.3];

export type PickedPhoto = { dataUrl: string; width: number; height: number };

async function loadSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    // `from-image` aplica a orientação do EXIF: foto tirada com o celular
    // deitado chega em pé, como a pessoa viu na hora de tirar.
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("imagem ilegível"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Reduz e recomprime no próprio navegador. Sobe menos dado pela rede, cabe no
 * limite da Server Action e evita guardar no banco uma imagem muito maior do
 * que qualquer tela vai mostrar.
 */
async function shrink(file: File): Promise<PickedPhoto> {
  const source = await loadSource(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();

  let dataUrl = "";
  for (const quality of QUALITIES) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= TARGET_LENGTH) break;
  }

  return { dataUrl, width, height };
}

/**
 * Escolha da foto do treino: câmera ou galeria. São dois `input file` porque
 * `capture` é o que faz o celular abrir a câmera direto, em vez do seletor de
 * arquivos. No desktop o navegador ignora `capture` e os dois botões abrem o
 * seletor — degrada sozinho, sem precisar detectar dispositivo.
 */
export function PhotoField({
  error,
  onBusyChange,
}: {
  error?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string>();

  function setWorking(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Limpa o input para que escolher a mesma foto de novo ainda dispare troca.
    event.target.value = "";
    if (!file) return;

    setWorking(true);
    setLocalError(undefined);
    try {
      const picked = await shrink(file);
      if (picked.dataUrl.length > MAX_PHOTO_BASE64_LENGTH) {
        setLocalError("Não consegui reduzir essa foto o bastante. Tente outra.");
        return;
      }
      setPhoto(picked);
    } catch {
      setLocalError(
        "Não consegui ler essa imagem. Se veio do iPhone, tente tirar a foto pelo app.",
      );
    } finally {
      setWorking(false);
    }
  }

  const message = localError ?? error;

  return (
    <div className="w-full">
      {photo && (
        <>
          <input type="hidden" name="photo" value={photo.dataUrl} />
          <input type="hidden" name="photoWidth" value={photo.width} />
          <input type="hidden" name="photoHeight" value={photo.height} />
        </>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {photo ? (
        <div className="w-full overflow-hidden rounded-field border border-line">
          {/* Prévia local (data URL do próprio navegador): sem next/image,
              que otimizaria de novo uma imagem já comprimida aqui. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.dataUrl}
            alt="Prévia da foto do treino"
            className="h-[176px] w-full bg-field object-cover"
          />
          <div className="flex items-center gap-[8px] bg-white px-[12px] py-[10px]">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="rounded-pill border border-line-strong px-[14px] py-[8px] text-[14px] font-semibold text-ink transition-colors hover:bg-field disabled:opacity-60"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              disabled={busy}
              className="rounded-pill px-[14px] py-[8px] text-[14px] font-semibold text-danger transition-colors hover:bg-field disabled:opacity-60"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-[10px] rounded-field border border-dashed border-line-strong bg-field px-[14px] py-[16px]">
          <p className="text-[14px] font-semibold text-ink">
            Foto do treino{" "}
            <span className="font-medium text-faint">(opcional)</span>
          </p>
          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
              className="flex-1 rounded-pill bg-brand px-[14px] py-[11px] text-[14px] font-bold text-white transition-colors hover:bg-brand-press disabled:opacity-60"
            >
              {busy ? "Preparando…" : "Tirar foto"}
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className="flex-1 rounded-pill border border-line-strong bg-white px-[14px] py-[11px] text-[14px] font-semibold text-ink transition-colors hover:bg-field disabled:opacity-60"
            >
              Da galeria
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="mt-[6px] text-[13px] font-medium text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
