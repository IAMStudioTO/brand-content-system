// Brand Content System — Figma Plugin
// Main thread: accesso alla Figma Plugin API

figma.showUI(__html__, { width: 420, height: 640 });

type ParsedLayerName = {
  semanticRole: string | null;
  slotIndex: number | null;
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

function extractLayers(node: SceneNode): any[] {
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

    figma.ui.postMessage({
      type: "SELECTION_RESULT",
      ok: true,
      payload: {
        frameName: frame.name,
        width: Math.round(frame.width),
        height: Math.round(frame.height),
        layerCount: layers.length,
        layers
      }
    });
    return;
  }

  if (msg.type === "CLOSE_PLUGIN") {
    figma.closePlugin();
    return;
  }
};
