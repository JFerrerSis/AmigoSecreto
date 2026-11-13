"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface InviteQrProps {
  url: string;
  roomCode: string;
}

export function InviteQr({ url, roomCode }: InviteQrProps) {
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      setDataUrl("");
      return;
    }

    setLoading(true);

    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(url, {
          width: 360,
          margin: 1,
          errorCorrectionLevel: "M",
          color: {
            dark: "#173f35",
            light: "#ffffff",
          },
        }),
      )
      .then((value) => {
        if (!cancelled) setDataUrl(value);
      })
      .catch(() => {
        if (cancelled) return;
        toast({
          title: "No pudimos generar el QR",
          description: "Puedes compartir el link o el código de la sala.",
          variant: "error",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast, url]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="flex size-44 items-center justify-center rounded-2xl border border-line bg-paper p-2 shadow-soft">
        {dataUrl ? (
          <Image
            src={dataUrl}
            alt={`Código QR para unirse a la sala ${roomCode}`}
            width={160}
            height={160}
            unoptimized
            className="size-40 rounded-xl"
          />
        ) : (
          <p className="text-xs text-muted">
            {loading ? "Generando QR..." : "QR no disponible"}
          </p>
        )}
      </div>

      <div className="max-w-xs text-center sm:text-left">
        <p className="text-sm font-semibold text-ink">Escanea para unirte</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Apunta la cámara al código o descarga la imagen para compartirla con
          tu grupo.
        </p>
        {dataUrl ? (
          <a
            href={dataUrl}
            download={`invitacion-${roomCode}.png`}
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "mt-3",
            })}
          >
            <Download className="size-4" aria-hidden />
            Descargar QR
          </a>
        ) : null}
      </div>
    </div>
  );
}
