// No cached builds: every caller must finish a fresh local build before starting tests.
const { execFileSync, spawnSync } = require('node:child_process')
const path = require('node:path')

const LOCAL_API = 'http://127.0.0.1:54321'

function validateLocalConfig(config) {
  let database
  try { database = new URL(config.DB_URL) } catch { throw new Error('Invalid local database configuration') }
  if (config.API_URL !== LOCAL_API || !['postgres:', 'postgresql:'].includes(database.protocol) ||
      database.hostname !== '127.0.0.1' || database.port !== '54322' || database.pathname !== '/postgres' ||
      database.search || database.hash || !config.PUBLISHABLE_KEY ||
      config.PUBLISHABLE_KEY === 'sb_publishable_local_integration_only') {
    throw new Error('Refusing non-isolated Supabase configuration')
  }
  return { apiUrl: LOCAL_API, publishableKey: config.PUBLISHABLE_KEY }
}

function readVerifiedLocalConfig(root) {
  try {
    // All shell arguments are fixed; the workspace path is passed as cwd.
    const command = process.platform === 'win32'
      ? [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx.cmd --no-install supabase status -o json']]
      : ['npx', ['--no-install', 'supabase', 'status', '-o', 'json']]
    const raw = execFileSync(command[0], command[1], {
      cwd: path.resolve(root, '..', 'atomic-db-test'),
      encoding: 'utf8', timeout: 60000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    })
    const config = validateLocalConfig(JSON.parse(raw))
    const containers = execFileSync('docker', ['ps', '--format', '{{.Names}}'], {
      encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    }).trim().split(/\r?\n/)
    for (const name of ['supabase_db_civilhub-atomic-db-test', 'supabase_auth_civilhub-atomic-db-test', 'supabase_kong_civilhub-atomic-db-test']) {
      if (!containers.includes(name)) throw new Error('Missing isolated container')
    }
    for (const [name, internalPort, hostPort] of [
      ['supabase_db_civilhub-atomic-db-test', '5432/tcp', '54322'],
      ['supabase_kong_civilhub-atomic-db-test', '8000/tcp', '54321'],
    ]) {
      const ports = JSON.parse(execFileSync('docker', ['inspect', '--format', '{{json .NetworkSettings.Ports}}', name], {
        encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      }))
      if (!(ports[internalPort] || []).some(binding => binding.HostPort === hostPort &&
          ['127.0.0.1', '0.0.0.0', '::', '::1'].includes(binding.HostIp))) {
        throw new Error('Unexpected isolated port mapping')
      }
    }
    return config
  } catch {
    // CLI output contains credentials; never include it in an exception.
    throw new Error('Could not verify the isolated local Supabase CLI configuration and container ports')
  }
}

function prepareLocalBuild(root, { readConfig = readVerifiedLocalConfig, runBuild } = {}) {
  const config = readConfig(root)
  if (config.apiUrl !== LOCAL_API || !config.publishableKey || config.publishableKey === 'sb_publishable_local_integration_only') {
    throw new Error('Refusing an unverified local build configuration')
  }
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: LOCAL_API,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.publishableKey, NEXT_TELEMETRY_DISABLED: '1' }
  const build = runBuild || (settings => spawnSync(process.execPath,
    [require.resolve('next/dist/bin/next'), 'build'], {
      cwd: root, env: settings, stdio: 'inherit', windowsHide: true, timeout: 180000,
    }))
  // A present .next/BUILD_ID is never evidence of safety. No server starts if
  // this new build fails, regardless of any previous build on disk.
  const result = build(env)
  if (!result || result.status !== 0 || result.error || result.signal) {
    throw new Error('Fresh local production build failed; no tests were started')
  }
  return env
}

module.exports = { validateLocalConfig, prepareLocalBuild, readVerifiedLocalConfig }
