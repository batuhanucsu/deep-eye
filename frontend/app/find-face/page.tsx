"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { getPerson, type GetPersonResponse } from "@/lib/api";

export default function FindFacePage() {
  const { error: toastError } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GetPersonResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSelect = (file: File) => {
    setImage(file);
    setResult(null);
    setNotFound(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const data = await getPerson(image);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "No matching person found." || msg === "No persons registered in the database.") {
        setNotFound(true);
      } else {
        toastError(msg || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };



  const confidence = result?.confidence ?? 0;
  const confColor =
    confidence >= 0.75 ? "text-emerald-400" :
    confidence >= 0.50 ? "text-yellow-400" : "text-orange-400";
  const confBar =
    confidence >= 0.75 ? "bg-emerald-500" :
    confidence >= 0.50 ? "bg-yellow-500" : "bg-orange-500";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">
          <span>🔍</span> Face Recognition
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">Find Face</h1>
        <p className="text-gray-400">
          Upload a photo and DeepEye will identify the closest matching person from the database.
        </p>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <ImageUploader
            label="Drag & drop or click to upload a face photo"
            onImageSelect={handleSelect}
            disabled={loading}
          />

          {/* Selected file info */}
          {image && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700">
              <span className="text-lg">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{image.name}</p>
                <p className="text-xs text-gray-500">
                  {(image.size / 1024).toFixed(1)} KB · {image.type}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !image}
            className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Searching database…
              </span>
            ) : (
              "🔍 Find Person"
            )}
          </button>
        </form>
      </div>

      {/* Result card */}
      {result && (
        <div className="rounded-2xl border border-blue-800/50 bg-gray-900/60 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-blue-900/40 bg-blue-950/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-semibold uppercase tracking-widest">
              Match Found
            </span>
          </div>

          {/* Name */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shrink-0 select-none">
              {result.firstname[0]}{result.lastname[0]}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {result.firstname} {result.lastname}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Similarity score</span>
              <span className={`text-sm font-semibold tabular-nums ${confColor}`}>
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confBar}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Not found card */}
      {notFound && (
        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 px-6 py-8 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-lg font-semibold text-white">Sonuç bulunamadı</p>
          <p className="text-sm text-gray-500">Yüklenen fotoğraf için kayıtlı eşleşme bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
