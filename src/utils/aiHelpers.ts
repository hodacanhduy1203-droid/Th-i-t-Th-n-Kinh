export const sanitizeApiContents = (chat: any[], userPrompt: string) => {
  const rawContents = chat.filter(msg => msg.text && msg.text.trim() !== '');
  
  const apiContents: any[] = [];
  for (const msg of rawContents) {
    if (apiContents.length === 0) {
      if (msg.role === 'user') {
        apiContents.push({ role: 'user', parts: [{ text: msg.text }] });
      }
    } else {
      const lastRole = apiContents[apiContents.length - 1].role;
      if (lastRole !== msg.role) {
        apiContents.push({ role: msg.role, parts: [{ text: msg.text }] });
      } else {
        apiContents[apiContents.length - 1].parts[0].text += '\n\n' + msg.text;
      }
    }
  }
  
  const lastRole = apiContents.length > 0 ? apiContents[apiContents.length - 1].role : 'model';
  if (lastRole === 'user') {
    apiContents[apiContents.length - 1].parts[0].text += '\n\n' + userPrompt;
  } else {
    apiContents.push({ role: 'user', parts: [{ text: userPrompt }] });
  }

  return apiContents;
};
