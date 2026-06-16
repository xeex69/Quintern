// Quick test script — verify each AI provider responds individually
// by calling its underlying function. Bypasses the chain so we can
// validate each provider works with the configured key.
require('dotenv').config();
const config = require('../src/config');
const service = require('../src/modules/ai/service');

(async () => {
  const tests = [
    {
      name: 'groq',
      needs: !!config.ai.groqKey,
      fn: () =>
        service.callGroq({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
    {
      name: 'gemini',
      needs: !!config.ai.geminiKey,
      fn: () =>
        service.callGemini({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
    {
      name: 'openai',
      needs: !!config.ai.openaiKey,
      fn: () =>
        service.callOpenAI({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
    {
      name: 'huggingface',
      needs: !!config.ai.huggingfaceKey,
      fn: () =>
        service.callHuggingFace({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
    {
      name: 'deepseek',
      needs: !!config.ai.deepseekKey,
      fn: () =>
        service.callDeepSeek({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
    {
      name: 'anthropic',
      needs: !!config.ai.anthropicKey,
      fn: () =>
        service.callAnthropic({
          system: 'You are helpful.',
          messages: [
            { role: 'user', content: 'In 3 words, what is Quintern?' },
          ],
        }),
    },
  ];

  let pass = 0,
    fail = 0;
  for (const t of tests) {
    if (!t.needs) {
      console.log(`  ⏭  ${t.name.padEnd(12)}  (no key configured)`);
      continue;
    }
    const t0 = Date.now();
    try {
      const r = await t.fn();
      const ms = Date.now() - t0;
      console.log(
        `  ✓  ${t.name.padEnd(12)}  ${ms}ms  model=${r.model}  text="${(r.text || '').slice(0, 60)}"`
      );
      pass++;
    } catch (e) {
      const ms = Date.now() - t0;
      console.log(
        `  ✗  ${t.name.padEnd(12)}  ${ms}ms  ERR: ${e.message.slice(0, 120)}`
      );
      fail++;
    }
  }
  console.log(`\n  ${pass} passed / ${fail} failed`);
  process.exit(fail);
})();
