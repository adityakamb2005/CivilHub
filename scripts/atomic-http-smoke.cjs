// Anonymous HTTP regression checks against a loopback-only production build.
// No real credentials, database fixtures, browser automation or remote server.
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const path = require('node:path')

async function main() {
  const root = path.resolve(__dirname, '..')
  const origin = 'http://127.0.0.1:3017'
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3017'], {
    cwd: root,
    windowsHide: true,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_integration_only',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let checks = 0
  const serverErrors = []
  child.stderr.on('data', chunk => { serverErrors.push(chunk.toString()) })
  const exited = new Promise(resolve => child.once('exit', resolve))
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Local server startup timed out')), 20000)
      child.once('error', error => { clearTimeout(timeout); reject(error) })
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Local server exited before readiness: ${code}`)) })
      child.stderr.on('data', chunk => {
        if (chunk.toString().includes('EADDRINUSE')) {
          clearTimeout(timeout)
          reject(new Error('Smoke-test port is occupied; refusing to test an unknown server'))
        }
      })
      child.stdout.on('data', chunk => {
        if (/Ready in/.test(chunk.toString())) { clearTimeout(timeout); resolve() }
      })
    })
    const get = (route, headers = {}) => fetch(origin + route, {
      redirect: 'manual', headers, signal: AbortSignal.timeout(10000),
    })
    for (const route of ['/login', '/register', '/forgot-password', '/update-password', '/account-unavailable', '/contact', '/engineers', '/projects']) {
      const response = await get(route)
      assert.equal(response.status, 200, route)
      assert.match(await response.text(), /<html/, route)
      checks++
      console.log(`PASS public page ${route}`)
    }
    for (const route of ['/client/dashboard', '/engineer/dashboard', '/admin/dashboard', '/client/projects/new', '/client/projects/11111111-1111-4111-8111-111111111111/applications', '/client/messages', '/engineer/messages']) {
      for (const headers of [{}, { Cookie: 'sb-127-auth-token=base64-invalid' }]) {
        const response = await get(route, headers)
        assert.equal(response.status, 307, route)
        const location = new URL(response.headers.get('location'), origin)
        assert.equal(location.origin, origin)
        assert.equal(location.pathname, '/login')
        assert.equal(location.searchParams.get('redirect'), route)
        if (headers.Cookie) assert.match(response.headers.get('set-cookie') || '', /sb-127-auth-token=;.*Max-Age=0/i)
        checks++
        console.log(`PASS protected page ${route} (${headers.Cookie ? 'malformed session' : 'guest'})`)
      }
    }
    const callback = await get('/api/auth/callback?next=//evil.example')
    assert.equal(callback.status, 307)
    const callbackUrl = new URL(callback.headers.get('location'), origin)
    assert.ok(['localhost', '127.0.0.1'].includes(callbackUrl.hostname))
    assert.equal(callbackUrl.protocol, 'http:')
    assert.equal(callbackUrl.port, '3017')
    assert.equal(callbackUrl.pathname, '/login')
    assert.equal(callbackUrl.search, '?error=auth_callback_failed')
    checks++
    console.log('PASS callback without code stays local')
    console.log(`HTTP smoke: ${checks} passed, 0 failed. Browser and authenticated E2E not run.`)
  } catch (error) {
    console.error(serverErrors.join(''))
    throw error
  } finally {
    if (child.exitCode === null) child.kill()
    await exited
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
