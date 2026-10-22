const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validateLocalConfig, prepareLocalBuild } = require('../scripts/local-test-build.cjs')
const { main } = require('../scripts/atomic-http-smoke.cjs')

// Synthetic public settings only. No command, build, network or server is run.
const raw = { API_URL: 'http://127.0.0.1:54321', DB_URL: 'postgresql://postgres:unit-only@127.0.0.1:54322/postgres', PUBLISHABLE_KEY: 'unit-public-key' }
const local = { apiUrl: raw.API_URL, publishableKey: raw.PUBLISHABLE_KEY }

test('build configuration must use the isolated CLI endpoints', () => {
  assert.deepEqual(validateLocalConfig(raw), local)
  for (const config of [
    { ...raw, API_URL: 'https://example.invalid' },
    { ...raw, DB_URL: raw.DB_URL + '?host=example.invalid' },
    { ...raw, DB_URL: 'postgresql:///postgres?host=/tmp' },
    { ...raw, DB_URL: 'postgresql://127.0.0.1:54322,example.invalid/postgres' },
    { ...raw, DB_URL: 'postgresql://localhost:54322/postgres' },
    { ...raw, PUBLISHABLE_KEY: 'sb_publishable_local_integration_only' },
    { ...raw, PUBLISHABLE_KEY: '' },
  ]) assert.throws(() => validateLocalConfig(config))
})

test('a fresh build replaces inherited hosted public settings', () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.invalid'
    let buildSettings
    const result = prepareLocalBuild(process.cwd(), { readConfig: () => local, runBuild: env => {
      buildSettings = env
      return { status: 0 }
    } })
    assert.equal(buildSettings.NEXT_PUBLIC_SUPABASE_URL, raw.API_URL)
    assert.equal(buildSettings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, raw.PUBLISHABLE_KEY)
    assert.equal(result, buildSettings)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous
  }
})

test('an existing build never skips the required new build', () => {
  let builds = 0
  const options = { readConfig: () => local, runBuild: () => { builds++; return { status: 0 } } }
  prepareLocalBuild(process.cwd(), options)
  prepareLocalBuild(process.cwd(), options)
  assert.equal(builds, 2)
})

test('unverified settings are rejected before build execution', () => {
  let builds = 0
  assert.throws(() => prepareLocalBuild(process.cwd(), {
    readConfig: () => ({ ...local, apiUrl: 'https://example.invalid' }),
    runBuild: () => { builds++; return { status: 0 } },
  }))
  assert.equal(builds, 0)
})

test('failed, timed out or signaled builds cannot authorize a test server', () => {
  for (const result of [{ status: 1 }, { status: 0, error: new Error('timeout') }, { status: null, signal: 'SIGTERM' }]) {
    assert.throws(() => prepareLocalBuild(process.cwd(), { readConfig: () => local, runBuild: () => result }), /no tests were started/)
  }
})

test('standalone HTTP checks fail before server startup when a fresh build is unavailable', async () => {
  let starts = 0
  await assert.rejects(main({
    prepareBuild: () => { throw new Error('Unverified existing build; fresh local build failed') },
    startServer: () => { starts++ },
  }), /fresh local build failed/)
  assert.equal(starts, 0)
})
