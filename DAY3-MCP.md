# Day 3 MCP exercise

Connected the public, read-only OpenAI developer documentation MCP server:

```sh
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
codex mcp list
```

`codex mcp list` showed `openaiDeveloperDocs` as enabled. A direct MCP `initialize` request returned server name `openai-docs-mcp` and protocol version `2025-03-26`; `tools/list` exposed `search_openai_docs` and `fetch_openai_doc`.

**Question asked through the MCP server:** “How do I add the OpenAI documentation MCP server to Codex CLI and verify it is configured?”

**Answer from `fetch_openai_doc` for https://developers.openai.com/learn/docs-mcp:** Run the `codex mcp add` command above, then `codex mcp list` to verify it. The response also identifies `https://developers.openai.com/mcp` as the server URL.

This is a separate tooling exercise. Recipe Box itself does not need an MCP server to save recipes.
