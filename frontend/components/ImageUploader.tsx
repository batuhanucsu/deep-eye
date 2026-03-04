"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onImageSelect: (file: File, preview: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelect, label = "Upload Image", disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelect(file, url);
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-700 hover:border-gray-500 bg-gray-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="max-h-64 max-w-full rounded-xl object-contain"
          />
        ) : (
          <>
            <span className="text-4xl mb-3">📷</span>
            <p className="text-gray-400 text-sm text-center">
              {isDragActive ? "Drop the image here…" : `${label} – drag & drop or click to browse`}
            </p>
            <p className="text-gray-600 text-xs mt-1">JPG, JPEG, PNG, WEBP</p>
          </>
        )}
      </div>
      {preview && (
        <button
          type="button"
          onClick={() => setPreview(null)}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors self-end"
        >
          ✕ Remove image
        </button>
      )}
    </div>
  );
}
