# Connect an OpenAI-compatible LLM

This workspace includes a minimal HTTP client, VS Code tasks, and a REST Client request. The guide you shared uses `api.freellm.com` and `gpt-4o-mini` as examples; those are placeholders, not a verified provider configuration. Get the exact chat-completions URL, model ID, and API key from the provider you choose.

## Configure credentials

1. Copy `.env.example` to `.env` in the workspace root.
2. Set `FREELLM_API_URL` to the provider's full chat-completions endpoint (often ends in `/v1/chat/completions`), `FREELLM_API_KEY` to your key, and `FREELLM_MODEL` to a model ID supported by that provider.
3. Keep `.env` local. It is ignored by Git.

The client uses Node's built-in `fetch`, so no SDK or extra package is needed. Use Node.js 18 or newer.

## Ways to call it

- From the terminal, run `node tools/freellm-demo.mjs` for a sample prompt.
- Run `node tools/ask-freellm.mjs "your prompt"` to ask a question.
- In VS Code, run **Terminal: Run Task**, then choose **Ask configured LLM** or **Try configured LLM demo**. The ask task prompts for text; VS Code tasks do not provide the `${selectedText}` variable shown in the original guide.
- To send a raw request in the editor, install the `humao.rest-client` extension, open `freellm.http`, and select **Send Request**. REST Client reads the three values directly from the root `.env` file via its dotenv variables.

## Provider compatibility

The scripts expect an OpenAI-compatible `POST` endpoint accepting a bearer token and a JSON body with `model`, `messages`, `temperature`, and `max_tokens`. They read the response from `choices[0].message.content`. Providers with a different API shape need a small client change.

The guide's ChatGPT-style extension settings are specific to a particular third-party extension and its current version. This repo does not install or configure that extension; use the generic REST Client request or the included terminal tasks unless you have confirmed an extension supports your provider's endpoint.
