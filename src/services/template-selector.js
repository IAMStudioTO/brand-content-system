function selectTemplateForRole(workspace, role) {
  return workspace.templates.find((template) => template.roles.includes(role)) || null;
}

module.exports = { selectTemplateForRole };
