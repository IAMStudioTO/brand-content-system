type ContentResponse = {
  id: string;
  workspaceId: string;
  contentMode: string;
  numberOfSlides: number;
  selectedVariant: number;
  createdAt: string;
  slides?: Array<{
    role: string;
    templateId: string;
    textAssignments?: Record<string, string>;
    svgAssignments?: Record<string, string>;
    imageRequirements?: Record<string, unknown>;
    cta?: boolean;
  }>;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function fetchContent(id: string): Promise<ContentResponse> {
  const res = await fetch(`http://127.0.0.1:3001/backend/client/content/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel caricamento contenuto");
  }

  return res.json();
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const content = await fetchContent(id);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <a href="/" className="text-sm underline">
          ← Torna alla dashboard
        </a>

        <div className="rounded-2xl border p-6">
          <h1 className="text-3xl font-bold">Dettaglio contenuto</h1>
          <p className="mt-2 text-sm text-gray-600">Content ID: {content.id}</p>
          <p className="mt-2 text-sm text-gray-600">Workspace: {content.workspaceId}</p>
          <p className="mt-2 text-sm text-gray-600">Modalità: {content.contentMode}</p>
          <p className="mt-2 text-sm text-gray-600">Slide: {content.numberOfSlides}</p>
          <p className="mt-2 text-sm text-gray-600">Variante selezionata: {content.selectedVariant}</p>
          <p className="mt-2 text-sm text-gray-600">Creato il: {content.createdAt}</p>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Slide</h2>

          <div className="mt-4 flex flex-col gap-4">
            {(content.slides || []).map((slide, index) => (
              <div key={index} className="rounded-xl border p-4">
                <p><strong>Indice:</strong> {index + 1}</p>
                <p><strong>Ruolo:</strong> {slide.role}</p>
                <p><strong>Template:</strong> {slide.templateId}</p>
                <p><strong>CTA:</strong> {slide.cta ? "Sì" : "No"}</p>

                <div className="mt-3">
                  <p className="font-medium">Testi</p>
                  <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs">
{JSON.stringify(slide.textAssignments || {}, null, 2)}
                  </pre>
                </div>

                <div className="mt-3">
                  <p className="font-medium">SVG</p>
                  <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs">
{JSON.stringify(slide.svgAssignments || {}, null, 2)}
                  </pre>
                </div>

                <div className="mt-3">
                  <p className="font-medium">Image requirements</p>
                  <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-3 text-xs">
{JSON.stringify(slide.imageRequirements || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
