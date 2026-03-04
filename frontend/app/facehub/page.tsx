"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { registerPerson } from "@/lib/api";

export default function FaceHubPage() {
  const { success, error: toastError } = useToast();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (file: File) => setImage(file);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstname.trim() || !lastname.trim() || !image) {
      toastError("First name, last name and image are all required.");
      return;
    }
    setLoading(true);

    try {
      await registerPerson(firstname.trim(), lastname.trim(), image);
      success(`${firstname.trim()} ${lastname.trim()} was registered successfully.`);
      setFirstname("");
      setLastname("");
      setImage(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !image || !firstname.trim() || !lastname.trim();

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-3">
          <span>🗂️</span> Face Database
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">FaceHub</h1>
        <p className="text-gray-400">
          Register a new person by providing their name and a clear face photo.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-300 font-medium">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="e.g. Jane"
                disabled={loading}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-300 font-medium">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="e.g. Doe"
                disabled={loading}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-300 font-medium">
              Face Photo <span className="text-red-500">*</span>
            </label>
            <ImageUploader
              label="Drag & drop or click to upload"
              onImageSelect={handleSelect}
              disabled={loading}
            />
          </div>

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
            disabled={isDisabled}
            className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Registering…
              </span>
            ) : (
              "✚ Register Person"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
