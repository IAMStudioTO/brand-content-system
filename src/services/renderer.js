function toRenderPayload(workspace, generatedContent) {
  return {
    workspaceId: workspace.id,
    format: workspace.format,
    slides: generatedContent.slides.map((slide, index) => ({
      slideIndex: index,
      role: slide.role,
      templateId: slide.templateId,
      layers: {
        text: slide.textAssignments,
        svg: slide.svgAssignments,
        image: slide.imageRequirements
      }
    }))
  };
}

module.exports = { toRenderPayload };
