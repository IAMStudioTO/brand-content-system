"use strict";
// Brand Content System — Figma Plugin
// Main thread: accesso alla Figma Plugin API
figma.showUI(__html__, { width: 420, height: 640 });
function parseLayerName(layerName) {
    const name = layerName.trim().toLowerCase();
    const exactRoles = ["headline", "body", "background"];
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
function extractLayers(node) {
    if (!("children" in node))
        return [];
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
function summarizeAvailableSlots(layers) {
    const counts = {};
    for (const layer of layers) {
        if (!layer.semanticRole)
            continue;
        if (!counts[layer.semanticRole]) {
            counts[layer.semanticRole] = 0;
        }
        counts[layer.semanticRole] += 1;
    }
    return counts;
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
        const frame = node;
        const layers = extractLayers(frame);
        const availableSlots = summarizeAvailableSlots(layers);
        figma.ui.postMessage({
            type: "SELECTION_RESULT",
            ok: true,
            payload: {
                templateId: frame.name,
                frameName: frame.name,
                width: Math.round(frame.width),
                height: Math.round(frame.height),
                layerCount: layers.length,
                availableSlots,
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
