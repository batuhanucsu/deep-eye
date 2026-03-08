"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { deletePerson, listPersons, registerPerson, type PersonResponse } from "@/lib/api";

export default function FaceHubPage() {
  const { success, error: toastError } = useToast();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [persons, setPersons] = useState<PersonResponse[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await listPersons();
      setPersons(data);
    } catch {
      // silently ignore
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

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
      await fetchPersons();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (person: PersonResponse) => {
    if (!confirm(`Delete ${person.full_name}? This cannot be undone.`)) return;
    setDeletingId(person.id);
    try {
      await deletePerson(person.id);
      success(`${person.full_name} deleted.`);
      setPersons((prev) => prev.filter((p) => p.id !== person.id));
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
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

      {/* Persons grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Registered Persons
            {!listLoading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({persons.length})
              </span>
            )}
          </h2>
          <button
            onClick={fetchPersons}
            disabled={listLoading}
            className="text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-40"
          >
            ↻ Refresh
          </button>
        </div>

        {listLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : persons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 py-12 flex flex-col items-center gap-2 text-gray-600">
            <span className="text-3xl">👤</span>
            <p className="text-sm">No persons registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {persons.map((person) => (
              <div
                key={person.id}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-800 bg-gray-900/60 hover:border-gray-600 transition-all"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-xl font-bold text-white select-none shrink-0">
                  {person.firstname[0]}{person.lastname[0]}
                </div>

                {/* Name */}
                <p className="text-sm font-medium text-white text-center leading-snug truncate w-full text-center">
                  {person.full_name}
                </p>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(person)}
                  disabled={deletingId === person.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white transition-all disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === person.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
