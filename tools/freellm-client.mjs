import { readFile } from 'node:fs/promises';

async function loadLocalEnv() {
  try {
    const source = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || match[1] in process.env) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function ask(prompt) {
  await loadLocalEnv();
  const { FREELLM_API_URL: url, FREELLM_API_KEY: key, FREELLM_MODEL: model } = process.env;
  if (!url || !key || !model) {
    throw new Error('Set FREELLM_API_URL, FREELLM_API_KEY, and FREELLM_MODEL in .env.');
  }
  if (!prompt?.trim()) throw new Error('Provide a prompt.');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    throw new Error(`Provider returned ${response.status} ${response.statusText}: ${detail}`);
  }
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== 'string') throw new Error('Provider response did not contain choices[0].message.content.');
  return answer;
}
