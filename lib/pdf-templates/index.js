import ResumeTemplate from './ResumeTemplate';
import { ResumeExecutiveNavy } from './templates/ResumeExecutiveNavy';

// Template registry - maps template IDs to React components
const templates = {
  'Resume-Executive-Navy': ResumeExecutiveNavy,
};

export const getTemplate = (templateId) => {
  // Default to 'Resume' if template not found
  const templateName = templateId || 'Resume';
  return templates[templateName] || templates['Resume'];
};

export default templates;

