import { ask } from './freellm-client.mjs';

try {
  console.log(await ask('Explain the difference between let and const in JavaScript.'));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
