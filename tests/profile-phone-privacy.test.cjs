const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the public server components with a database boundary that refuses
// private profile reads. PostgreSQL/RLS is tested separately by the SQL suite.
const publicProfile = {
  id: '11111111-1111-4111-8111-111111111111', role: 'engineer',
  full_name: 'Public fixture engineer', avatar_url: null, location: 'Fixture city',
}
const engineer = {
  id: '22222222-2222-4222-8222-222222222222', profile_id: publicProfile.id,
  visibility: 'public', title: 'Fixture engineer', specialization: 'Other',
  years_experience: 3, is_verified: false, is_available: true,
}

function loadPage(file, visibility = 'public') {
  const calls = []
  const db = {
    from(table) {
      assert.notEqual(table, 'profiles', 'Public rendering must not read private base rows')
      calls.push(table)
      const rows = table === 'public_profiles' ? [publicProfile]
        : table === 'engineer_profiles' ? [{ ...engineer, visibility }] : []
      const query = {}
      for (const method of ['select', 'eq', 'in', 'order']) query[method] = () => query
      query.single = query.maybeSingle = async () => ({ data: rows[0] || null, error: null })
      query.then = (resolve, reject) => Promise.resolve({ data: rows, error: null }).then(resolve, reject)
      return query
    },
  }
  const mocks = {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } },
    'next/link': { __esModule: true, default: 'a' },
    './EngineersDirectoryClient': { EngineersDirectoryClient: 'engineer-directory' },
  }
  const module = { exports: {} }
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name === 'react/jsx-runtime' || name === 'lucide-react') return require(name)
      throw new Error(`Unexpected import: ${name}`)
    },
  }, { filename: file })
  return { exports: module.exports, calls }
}

test('directory still supplies public engineer names and locations without private rows', async () => {
  const page = loadPage('app/(public)/engineers/page.tsx')
  const tree = await page.exports.default()
  const text = JSON.stringify(tree)
  assert.match(text, /Public fixture engineer/)
  assert.match(text, /Fixture city/)
  assert.deepEqual(page.calls, ['engineer_profiles', 'public_profiles'])
  assert.doesNotMatch(text, /phone/)
})

test('public engineer page and metadata work through the safe projection', async () => {
  const page = loadPage('app/(public)/engineers/[id]/page.tsx')
  const props = { params: Promise.resolve({ id: publicProfile.id }) }
  const metadata = await page.exports.generateMetadata(props)
  assert.match(metadata.title, /Public fixture engineer/)
  const tree = await page.exports.default(props)
  assert.match(JSON.stringify(tree), /Public fixture engineer/)
  assert.doesNotMatch(JSON.stringify(tree), /phone/)
  assert.ok(page.calls.includes('public_profiles'))
})

test('private engineers retain generic metadata and a 404 public profile', async () => {
  const page = loadPage('app/(public)/engineers/[id]/page.tsx', 'private')
  const props = { params: Promise.resolve({ id: publicProfile.id }) }
  assert.equal((await page.exports.generateMetadata(props)).title, 'Engineer Profile | CivilHub')
  await assert.rejects(page.exports.default(props), /NOT_FOUND/)
})
