"use client";

import { useEffect, useState } from "react";
import { generateContent, listContents } from "@/lib/api";

type ContentItem = {
  id: string;
  createdAt: string;
  contentMode: string;
  numberOfSlides: number;
  numberOfVariants: number;
  selectedVariant: number;
};

const WORKSPACE_ID = "ws_acme";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");

  async function refreshList() {
    try {
      setLoadingList(true);
      setError("");
      const data = await listContents(WORKSPACE_ID);
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore caricamento lista");
    } finally {
      setLoadingList(false);
    }
  }

  async function onGenerate() {
    try {
      setLoading(true);
      setError("");
      await generateContent(WORKSPACE_ID, prompt);
      setPrompt("");
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore generazione");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Brand Content System</h1>
          <p className="text-sm text-gray-600">
            Workspace attivo: {WORKSPACE_ID}
          </p>
        </div>

        <section className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Genera contenuto</h2>

          <textarea
            className="min-h-[120px] w-full rounded-xl border p-3"
            placeholder="Scrivi il prompt del contenuto..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="mt-4">
            <button
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
              onClick={onGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "Generazione..." : "Genera"}
            </button>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contenuti</h2>
            <button
              className="rounded-xl border px-4 py-2"
              onClick={refreshList}
            >
              Aggiorna
            </button>
          </div>

          {loadingList ? (
            <p>Caricamento...</p>
          ) : items.length === 0 ? (
            <p>Nessun contenuto presente.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <p><strong>ID:</strong> <a className="underline" href={`/content/${item.id}`}>{item.id}</a></p>
                  <p><strong>Modalità:</strong> {item.contentMode}</p>
                  <p><strong>Slide:</strong> {item.numberOfSlides}</p>
                  <p><strong>Varianti:</strong> {item.numberOfVariants}</p>
                  <p><strong>Variante selezionata:</strong> {item.selectedVariant}</p>
                  <p><strong>Creato il:</strong> {item.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
