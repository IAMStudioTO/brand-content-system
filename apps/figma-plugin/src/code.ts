// Brand Content System — Figma Plugin
// Main thread: accesso alla Figma Plugin API

figma.showUI(__html__, { width: 420, height: 640 });

type ParsedLayerName = {
  semanticRole: string | null;
  slotIndex: number | null;
};

type ExtractedLayer = {
  name: string;
  semanticRole: string | null;
  slotIndex: number | null;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zIndex: number;
};

type BackendLayer =
  | {
      name: string;
      type: "text";
      rules: { maxChars: number };
    }
  | {
      name: string;
      type: "image";
    }
  | {
      name: string;
      type: "svg";
      assetUrl: string;
    };

function parseLayerName(layerName: string): ParsedLayerName {
  const name = layerName.trim().toLowerCase();

  const exactRoles = ["headline", "body", "background"] as const;
  for (const role of exactRoles) {
    if (name === role) {
      return { semanticRole: role, slotIndex: null };
    }
  }

  const indexedMatch = name.match(/^(image|logo|cta|component|decoration)_(\d+)$/);
  if (indexedMatch) {
    return {
      semanticRole: indexedMatch[1],
      slotIndex: Number(indexedMatch[2])
    };
  }

  return { semanticRole: null, slotIndex: null };
}

function extractLayers(node: SceneNode): ExtractedLayer[] {
  if (!("children" in node)) return [];

  return node.children.map((child, index) => {
    const parsed = parseLayerName(child.name);

    return {
      name: child.name,
      semanticRole: parsed.semanticRole,
      slotIndex: parsed.slotIndex,
      type: child.type,
      x: child.x,
      y: child.y,
      width: child.width,
      height: child.height,
      visible: child.visible,
      zIndex: index
    };
  });
}

function summarizeAvailableSlots(layers: ExtractedLayer[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const layer of layers) {
    if (!layer.semanticRole) continue;
    counts[layer.semanticRole] = (counts[layer.semanticRole] || 0) + 1;
  }

  return counts;
}

function toBackendLayer(layer: ExtractedLayer): BackendLayer | null {
  if (!layer.semanticRole) return null;

  if (layer.semanticRole === "headline") {
    return {
      name: "text/headline",
      type: "text",
      rules: { maxChars: 120 }
    };
  }

  if (layer.semanticRole === "body") {
    return {
      name: "text/body",
      type: "text",
      rules: { maxChars: 400 }
    };
  }

  if (layer.semanticRole === "image") {
    const suffix = layer.slotIndex ? `_${layer.slotIndex}` : "";
    return {
      name: `image/image${suffix}`,
      type: "image"
    };
  }

  if (
    layer.semanticRole === "background" ||
    layer.semanticRole === "logo" ||
    layer.semanticRole === "cta" ||
    layer.semanticRole === "component" ||
    layer.semanticRole === "decoration"
  ) {
    const suffix = layer.slotIndex ? `_${layer.slotIndex}` : "";
    const slotName = `${layer.semanticRole}${suffix}`;

    return {
      name: `svg/${slotName}`,
      type: "svg",
      assetUrl: `https://example.com/${slotName}.svg`
    };
  }

  return null;
}

function buildBackendPayload(
  workspaceId: string,
  frameName: string,
  width: number,
  height: number,
  layers: ExtractedLayer[]
) {
  const backendLayers = layers
    .map(toBackendLayer)
    .filter((layer): layer is BackendLayer => layer !== null);

  return {
    workspaceId,
    template: {
      id: frameName,
      name: frameName,
      width,
      height,
      roles: ["single"],
      layers: backendLayers
    }
  };
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "SCAN_SELECTION") {
    const selection = figma.currentPage.selection;

    if (!selection || selection.length === 0) {
      figma.ui.postMessage({
        type: "SELECTION_RESULT",
        ok: false,
        error: "Seleziona un Frame, Component o Instance in Figma."
      });
      return;
    }

    const node = selection[0];

    if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") {
      figma.ui.postMessage({
        type: "SELECTION_RESULT",
        ok: false,
        error: "Seleziona un FRAME, COMPONENT o INSTANCE."
      });
      return;
    }

    const frame = node as FrameNode | ComponentNode | InstanceNode;
    const layers = extractLayers(frame);
    const availableSlots = summarizeAvailableSlots(layers);
    const backendPayload = buildBackendPayload(
      "ws_acme",
      frame.name,
      Math.round(frame.width),
      Math.round(frame.height),
      layers
    );

    figma.ui.postMessage({
      type: "SELECTION_RESULT",
      ok: true,
      payload: { testFlag: "🔥NUOVA_VERSIONE🔥",
        templateId: frame.name,
        frameName: frame.name,
        width: Math.round(frame.width),
        height: Math.round(frame.height),
        layerCount: layers.length,
        availableSlots,
        layers,
        backendPayload
      }
    });
    return;
  }

  if (msg.type === "CLOSE_PLUGIN") {
    figma.closePlugin();
    return;
  }
};
