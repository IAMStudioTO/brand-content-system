"use strict";
// Brand Content System — Figma Plugin
// Main thread: accesso alla Figma Plugin API
figma.showUI(__html__, { width: 420, height: 640 });
function inferSemanticRole(layerName) {
    const name = layerName.trim().toLowerCase();
    if (name === "headline")
        return "headline";
    if (name === "body")
        return "body";
    if (name === "image")
        return "image";
    if (name === "background")
        return "background";
    return null;
}
function extractLayers(node) {
    if (!("children" in node))
        return [];
    return node.children.map((child, index) => ({
        name: child.name,
        semanticRole: inferSemanticRole(child.name),
        type: child.type,
        x: child.x,
        y: child.y,
        width: child.width,
        height: child.height,
        visible: child.visible,
        zIndex: index
    }));
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
