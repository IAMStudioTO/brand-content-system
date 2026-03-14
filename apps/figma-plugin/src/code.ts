figma.showUI(__html__, { width: 420, height: 640 });

type SyncPayload = {
  frameName: string;
  width: number;
  height: number;
  layerCount: number;
};

function collectSelection(): SyncPayload | null {
  const node = figma.currentPage.selection[0];
  if (!node) return null;

  if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") {
    return null;
  }

  const frame = node as FrameNode | ComponentNode | InstanceNode;

  return {
    frameName: frame.name,
    width: Math.round(frame.width),
    height: Math.round(frame.height),
    layerCount: "children" in frame ? frame.children.length : 0
  };
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "GET_SELECTION") {
    const payload = collectSelection();

    if (!payload) {
      figma.ui.postMessage({
        type: "SELECTION_RESULT",
        ok: false,
        error: "Seleziona un Frame, Component o Instance in Figma."
      });
      return;
    }

    figma.ui.postMessage({
      type: "SELECTION_RESULT",
      ok: true,
      payload
    });
    return;
  }

  if (msg.type === "CLOSE") {
    figma.closePlugin();
  }
};
