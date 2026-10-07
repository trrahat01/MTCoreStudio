import { ask } from './freellm-client.mjs';

try {
  const prompt = process.argv.slice(2).join(' ');
  console.log(await ask(prompt));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
