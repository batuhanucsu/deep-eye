"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { describeImage, type DescribeResponse } from "@/lib/api";

export default function DescribeImagePage() {
  const { error: toastError } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DescribeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelect = (file: File, dataUrl: string) => {
    setImage(file);
    setPreview(dataUrl);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    setResult(null);

    try {
      const data = await describeImage(image);
      setResult(data);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3">
          <span>🖼️</span> Vision LLM
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">Describe Image</h1>
        <p className="text-gray-400">
          Upload any image and the AI vision model will generate a detailed description.
        </p>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <ImageUploader
            label="Drag & drop or click to upload"
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
            className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Generating description…
              </span>
            ) : (
              "✨ Describe Image"
            )}
          </button>
        </form>
      </div>

      {/* Result card */}
      {result && (
        <div className="rounded-2xl border border-purple-800/50 bg-gray-900/60 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40 bg-purple-950/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-300 font-semibold uppercase tracking-widest">
                AI Description
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-700"
            >
              {copied ? "✅ Copied" : "📋 Copy"}
            </button>
          </div>

          {/* Two-column layout: preview + text */}
          <div className="flex flex-col sm:flex-row gap-0">
            {preview && (
              <div className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="uploaded"
                  className="w-full h-40 sm:h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-6">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-[15px]">
                {result.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
