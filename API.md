# API Route API access

API Route is a paid, self-serve hosted API. [Register an account](https://www.api-route.com/register),
add account credit, and create a key in [API Keys](https://www.api-route.com/api-keys).
Current models and billing are listed on the [pricing page](https://www.api-route.com/pricing).

## Endpoint and authentication

OpenAI-compatible base URL: `https://global.api-route.com/v1`.
Authenticate with an API key in the HTTP header:

```http
Authorization: Bearer <API_ROUTE_API_KEY>
```

Use the key through an environment variable when calling the API:

```sh
curl https://global.api-route.com/v1/models \
  -H "Authorization: Bearer $API_ROUTE_API_KEY"
```

This read-only endpoint returns the model IDs available to that key. Use one of those IDs
for a Chat Completions request; `model-id-from-models` below is a placeholder:

```sh
curl https://global.api-route.com/v1/chat/completions \
  -H "Authorization: Bearer $API_ROUTE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"model-id-from-models","messages":[{"role":"user","content":"Hello"}]}'
```

Chat Completions requests are billed according to the selected model and account configuration.
See the [quickstart](https://www.api-route.com/docs/quickstart) for client setup.

## CORS

The OpenAI-compatible API supports cross-origin requests using Bearer authentication.
Browser requests should use `credentials: "omit"` and supply the key via the `Authorization`
header; cookie-based credentialed requests are not supported by the wildcard origin policy.
Keep shared production credentials on your server rather than in a public frontend bundle.

Verified against the production endpoint on 2026-10-01:

- `OPTIONS /v1/models` and `OPTIONS /v1/chat/completions` returned `204` with
  `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`,
  and `Access-Control-Allow-Headers: *`.
- An authenticated `GET /v1/models` with a cross-origin `Origin` returned `200` and a single
  `Access-Control-Allow-Origin: *` header.
- Missing or invalid keys are rejected with `401`. Some authentication-error responses may
  not have browser-readable CORS headers; diagnose the key with a server-side client if the
  browser reports a CORS error instead of exposing that response.

To inspect preflight behavior without an API key:

```sh
curl -i -X OPTIONS https://global.api-route.com/v1/chat/completions \
  -H 'Origin: https://example.org' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```
