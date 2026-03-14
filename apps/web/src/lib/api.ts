const API_BASE = "/backend";

export async function generateContent(workspaceId: string, prompt: string) {
  const res = await fetch(`${API_BASE}/client/content/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspaceId,
      prompt,
    }),
  });

  if (!res.ok) {
    throw new Error("Generate failed");
  }

  return res.json();
}

export async function listContents(workspaceId: string) {
  const res = await fetch(
    `${API_BASE}/client/contents?workspaceId=${workspaceId}`
  );

  if (!res.ok) {
    throw new Error("List failed");
  }

  return res.json();
}
