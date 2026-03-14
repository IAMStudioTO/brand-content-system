const workspace = {
  id: 'ws_acme',
  brandId: 'brand_acme',
  name: 'ACME Workspace',
  format: 'linkedin-1080x1350',
  templates: [
    {
      id: 'template_cover_01',
      name: 'Cover Statement',
      width: 1080,
      height: 1350,
      textSlots: {
        headline: { maxChars: 70 },
        subtitle: { maxChars: 120 }
      },
      imageSlots: [],
      svgSlots: ['background_main', 'decor_top_right', 'accent_bottom'],
      roles: ['cover', 'cta']
    },
    {
      id: 'template_explainer_01',
      name: 'Explainer',
      width: 1080,
      height: 1350,
      textSlots: {
        headline: { maxChars: 80 },
        body: { maxChars: 240 }
      },
      imageSlots: ['hero'],
      svgSlots: ['background_main', 'accent_bottom'],
      roles: ['problem', 'consequence', 'solution', 'explanation']
    }
  ],
  svgAssets: [
    {
      id: 'svg_bg_01',
      category: 'background',
      compatibleSlots: ['background_main'],
      compatibleTemplates: ['template_cover_01', 'template_explainer_01'],
      isActive: true
    },
    {
      id: 'svg_decor_03',
      category: 'decorative',
      compatibleSlots: ['decor_top_right'],
      compatibleTemplates: ['template_cover_01'],
      isActive: true
    },
    {
      id: 'svg_accent_02',
      category: 'accent',
      compatibleSlots: ['accent_bottom'],
      compatibleTemplates: ['template_cover_01', 'template_explainer_01'],
      isActive: true
    }
  ]
};

module.exports = { workspace };
