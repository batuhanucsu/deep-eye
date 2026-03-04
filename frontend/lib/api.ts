import apiClient from "./apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonResponse {
  id: string;
  firstname: string;
  lastname: string;
  full_name: string;
  embedding?: number[];
}

export interface LoadPersonResponse {
  status: string;
}

export interface GetPersonResponse {
  firstname: string;
  lastname: string;
  confidence: number;
}

export interface DescribeResponse {
  description: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function imageForm(image: File, extra?: Record<string, string>): FormData {
  const form = new FormData();
  form.append("image", image);
  if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  return form;
}

// ── Person endpoints ──────────────────────────────────────────────────────────

export async function registerPerson(
  firstname: string,
  lastname: string,
  image: File
): Promise<LoadPersonResponse> {
  const form = imageForm(image, { firstname, lastname });
  const { data } = await apiClient.post<LoadPersonResponse>("/load-person", form);
  return data;
}

export async function getPerson(image: File): Promise<GetPersonResponse> {
  const { data } = await apiClient.post<GetPersonResponse>("/get-person", imageForm(image));
  return data;
}

export async function listPersons(): Promise<PersonResponse[]> {
  const { data } = await apiClient.get<PersonResponse[]>("/persons");
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  await apiClient.delete(`/persons/${id}`);
}


// ── Describe endpoint ─────────────────────────────────────────────────────────

export async function describeImage(image: File): Promise<DescribeResponse> {
  const { data } = await apiClient.post<DescribeResponse>("/describe-image", imageForm(image));
  return data;
}

