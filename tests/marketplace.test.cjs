const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Text regression checks only: these do not parse/execute PostgreSQL or prove ACLs.
test('prepared acceptance SQL uses paired dollar quotes, not bare-dollar delimiters', () => {
  for (const file of [
    'supabase/migrations/015_project_application_identity_guard.sql',
    'supabase/migrations/016_atomic_project_acceptance.sql',
    'supabase/migrations/017_marketplace_profile_security.sql',
    'tests/sql/atomic_project_acceptance.sql',
    'tests/sql/atomic_project_acceptance.spec',
    'tests/sql/marketplace_profile_security.sql',
  ]) {
    const sql = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    assert.doesNotMatch(sql, /\b(?:AS|DO)\s+\$(?!\$|[a-z_])/i, file)
    assert.doesNotMatch(sql, /^\s*(?:END\s+)?\$;\s*$/m, file)
    assert.equal((sql.match(/\$\$/g) || []).length % 2, 0, file)
  }
})

test('acceptance SQL uses the existing migration owner with restricted API execution', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/016_atomic_project_acceptance.sql'), 'utf8')
  assert.doesNotMatch(sql, /CREATE ROLE|ALTER FUNCTION .* OWNER TO/)
  assert.match(sql, /current_user <> 'postgres'/)
  assert.match(sql, /relforcerowsecurity/)
  assert.match(sql, /pg_has_role/)
  assert.match(sql, /REVOKE ALL ON FUNCTION public.accept_project_application\(UUID, UUID\) FROM PUBLIC, anon, authenticated, service_role;/)
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.accept_project_application\(UUID, UUID\) TO authenticated;/)
  assert.match(sql, /SECURITY DEFINER SET search_path = pg_catalog/)
})

// Execute the real TypeScript actions with a scripted Supabase boundary.
// These tests exercise application behavior, not PostgreSQL constraints or RLS.
function load(file, mocks, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(output, {
    module, exports: module.exports, FormData, URL, process: { env: {} }, ...globals,
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name === 'react/jsx-runtime') return require(name)
      throw new Error(`Unexpected import: ${name}`)
    },
  }, { filename: file })
  return module.exports
}

const projectId = '11111111-1111-4111-8111-111111111111'
const applicationId = '22222222-2222-4222-8222-222222222222'
const engineerId = '33333333-3333-4333-8333-333333333333'
const clientId = '44444444-4444-4444-8444-444444444444'
const userId = '55555555-5555-4555-8555-555555555555'
const ok = (data) => ({ data, error: null })
const fail = { data: null, error: { code: 'XX000', message: 'database failure' } }

function harness(file, responses, authenticated = true, extra = {}, authError = null) {
  const calls = []
  const invalidations = []
  let index = 0
  const db = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: userId } : null }, error: authError }) },
    async rpc(name, args) {
      calls.push({ rpc: name, args, operations: [] })
      assert.ok(index < responses.length, 'Unexpected RPC')
      return responses[index++]
    },
    from(table) {
      const call = { table, operations: [] }
      calls.push(call)
      const query = {}
      for (const method of ['select', 'insert', 'update', 'eq', 'neq', 'in', 'is', 'order']) {
        query[method] = (...args) => { call.operations.push([method, ...args]); return query }
      }
      const finish = () => {
        assert.ok(index < responses.length, `Unexpected query on ${table}`)
        const response = responses[index++]
        if (typeof response === 'function') return response(call)
        return response
      }
      query.maybeSingle = async () => finish()
      query.single = async () => finish()
      query.then = (resolve, reject) => Promise.resolve().then(finish).then(resolve, reject)
      return query
    },
  }
  const exports = load(file, {
    '@/lib/supabase/server': { createClient: async () => db },
    'next/cache': { revalidatePath: (p) => invalidations.push(p) },
    '@/lib/messaging/messagingErrors': { missingMessagingSchema: () => false },
    ...extra,
  })
  return { exports, calls, invalidations, consumed: () => index }
}

const actionsFile = 'lib/applications/projectActions.ts'
const owned = { id: projectId, client_profile_id: clientId, engineer_profile_id: null, status: 'planned' }
const pending = { id: applicationId, engineer_profile_id: engineerId, status: 'pending' }
const review = (project = owned, application = pending) => [ok({ role: 'client' }), ok({ id: clientId }), ok(project), ok(application)]
const form = (cover = 'I have relevant experience for this project.') => {
  const data = new FormData(); data.set('project_id', projectId); data.set('cover_message', cover); return data
}

test('application validation rejects short and overlong messages without database calls', async () => {
  for (const cover of ['short', 'x'.repeat(3001)]) {
    const h = harness(actionsFile, [])
    assert.ok((await h.exports.submitProjectApplication({}, form(cover))).error)
    assert.equal(h.calls.length, 0)
  }
})
test('unauthenticated submissions and decisions do not query data', async () => {
  const h = harness(actionsFile, [], false)
  assert.ok((await h.exports.submitProjectApplication({}, form())).error)
  for (const action of ['acceptProjectApplication', 'rejectProjectApplication', 'withdrawProjectApplication']) {
    assert.ok((await h.exports[action](projectId, applicationId)).error)
  }
  assert.equal(h.calls.length, 0)
})
test('invalid identifiers do not query data', async () => {
  const h = harness(actionsFile, [])
  for (const action of ['acceptProjectApplication', 'rejectProjectApplication', 'withdrawProjectApplication']) {
    assert.ok((await h.exports[action]('invalid', applicationId)).error)
  }
  assert.equal(h.calls.length, 0)
})
test('wrong-role decisions fail before profile or project access', async () => {
  for (const action of ['acceptProjectApplication', 'rejectProjectApplication', 'withdrawProjectApplication']) {
    const h = harness(actionsFile, [ok({ role: 'admin' })])
    assert.ok((await h.exports[action](projectId, applicationId)).error)
    assert.equal(h.calls.length, 1)
  }
})
test('non-owner cannot accept or reject', async () => {
  for (const action of ['acceptProjectApplication', 'rejectProjectApplication']) {
    const h = harness(actionsFile, review({ ...owned, client_profile_id: 'other-client' }).slice(0, 3))
    assert.ok((await h.exports[action](projectId, applicationId)).error)
    assert.equal(h.calls.some(c => c.operations.some(op => op[0] === 'update')), false)
  }
})
for (const [name, project, application] of [
  ['rejected application', owned, { ...pending, status: 'rejected' }],
  ['withdrawn application', owned, { ...pending, status: 'withdrawn' }],
  ['different assigned engineer', { ...owned, engineer_profile_id: 'other-engineer' }, pending],
  ['closed project', { ...owned, status: 'completed' }, pending],
  ['inconsistent accepted application', owned, { ...pending, status: 'accepted' }],
]) {
  test(`acceptance rejects ${name} without writes`, async () => {
    const h = harness(actionsFile, review(project, application))
    assert.ok((await h.exports.acceptProjectApplication(projectId, applicationId)).error)
    assert.equal(h.calls.length, 4)
  })
}
test('acceptance performs exactly one RPC and no direct table writes', async () => {
  const h = harness(actionsFile, [...review(), ok(null)])
  assert.equal((await h.exports.acceptProjectApplication(projectId, applicationId)).success, 'Engineer accepted and assigned.')
  assert.equal(h.calls.length, 5)
  assert.equal(h.calls[4].rpc, 'accept_project_application')
  assert.equal(h.calls[4].args.target_project_id, projectId)
  assert.equal(h.calls[4].args.target_application_id, applicationId)
  assert.equal(h.calls.some(c => c.operations.some(op => op[0] === 'update')), false)
  assert.ok(h.invalidations.includes('/engineer/projects'))
  assert.ok(h.invalidations.includes('/client/projects/' + projectId + '/applications'))
})

for (const [code, message] of [
  ['PA001', /Only clients/], ['PA002', /cannot review/],
  ['PA003', /no longer available/], ['PA004', /already has/],
  ['PA005', /not active/], ['PA006', /inconsistent/],
  ['XX000', /assignment could not be saved/], ['40P01', /assignment could not be saved/],
]) {
  test('RPC error ' + code + ' returns safe feedback without partial-success claims', async () => {
    const h = harness(actionsFile, [...review(), { error: { code, message: 'private diagnostic' } }])
    const result = await h.exports.acceptProjectApplication(projectId, applicationId)
    assert.match(result.error, message)
    assert.equal(result.success, undefined)
    assert.equal(h.invalidations.length, 0)
    assert.equal(h.calls.length, 5)
  })
}

test('same-engineer accepted retry uses the same atomic RPC', async () => {
  const h = harness(actionsFile, [...review({ ...owned, engineer_profile_id: engineerId }, { ...pending, status: 'accepted' }), ok(null)])
  assert.ok((await h.exports.acceptProjectApplication(projectId, applicationId)).success)
  assert.equal(h.calls[4].rpc, 'accept_project_application')
})

test('completed-project accepted retry reaches the RPC without writing directly', async () => {
  const h = harness(actionsFile, [...review({ ...owned, status: 'completed', engineer_profile_id: engineerId }, { ...pending, status: 'accepted' }), ok(null)])
  assert.ok((await h.exports.acceptProjectApplication(projectId, applicationId)).success)
  assert.equal(h.calls[4].rpc, 'accept_project_application')
  assert.equal(h.calls.some(c => c.operations.some(op => op[0] === 'update')), false)
})

test('zero-row rejection and withdrawal report failure', async () => {
  const h = harness(actionsFile, [...review().slice(0, 3), ok(null)])
  assert.ok((await h.exports.rejectProjectApplication(projectId, applicationId)).error)
  const w = harness(actionsFile, [ok({ role: 'engineer' }), ok({ id: engineerId }), ok(null)])
  assert.ok((await w.exports.withdrawProjectApplication(projectId, applicationId)).error)
  assert.ok(w.calls[2].operations.some(op => op[0] === 'eq' && op[1] === 'engineer_profile_id' && op[2] === engineerId))
})
const eligible = { id: projectId, is_published: true, engineer_profile_id: null, status: 'planned' }
const submission = (project = eligible) => [ok({ role: 'engineer' }), ok({ id: engineerId }), ok(project)]
test('ineligible projects cannot receive an application', async () => {
  for (const project of [{ ...eligible, is_published: false }, { ...eligible, status: 'on_hold' }, { ...eligible, engineer_profile_id: engineerId }]) {
    const h = harness(actionsFile, submission(project))
    assert.ok((await h.exports.submitProjectApplication({}, form())).error)
    assert.equal(h.calls.length, 3)
  }
})
test('application insertion uses authenticated engineer and handles duplicate constraint', async () => {
  const h = harness(actionsFile, [...submission(), { error: { code: '23505' } }])
  assert.match((await h.exports.submitProjectApplication({}, form())).error, /already submitted/)
  const insert = h.calls[3].operations.find(op => op[0] === 'insert')[1]
  assert.equal(insert.engineer_profile_id, engineerId)
  assert.equal(insert.project_id, projectId)
})
test('profile and project query failures are distinguished from missing or ineligible data', async () => {
  const h = harness(actionsFile, [ok({ role: 'engineer' }), fail])
  assert.match((await h.exports.submitProjectApplication({}, form())).error, /Could not load your engineer/)
  const p = harness(actionsFile, [...submission().slice(0, 2), fail])
  assert.match((await p.exports.submitProjectApplication({}, form())).error, /Could not load the project/)
})
test('notifications scope updates to current user and surface database or zero-row errors', async () => {
  for (const response of [fail, ok(null), ok({ id: applicationId })]) {
    const h = harness('lib/notifications/notificationActions.ts', [response])
    const result = await h.exports.markNotificationRead(applicationId)
    assert.equal(Boolean(result.error), !response.data)
    assert.ok(h.calls[0].operations.some(op => op[0] === 'eq' && op[1] === 'profile_id' && op[2] === userId))
  }
})
test('mark-all notification failures are returned without claiming success', async () => {
  const h = harness('lib/notifications/notificationActions.ts', [fail])
  assert.ok((await h.exports.markAllNotificationsRead()).error)
  assert.equal(h.invalidations.length, 0)
})
test('conversation database errors and nonparticipants cannot send messages', async () => {
  for (const response of [fail, ok({ client_profile: { profile_id: 'other-client' }, engineer_profile: { profile_id: 'other-engineer' } })]) {
    const h = harness('lib/messaging/messagingActions.ts', [response])
    assert.ok((await h.exports.sendMessage(applicationId, 'Hello')).error)
    assert.equal(h.calls.length, 1)
  }
})
test('message insert binds sender to current user', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [ok({ client_profile: { profile_id: userId } }), ok(null)])
  assert.ok((await h.exports.sendMessage(applicationId, ' Hello ')).success)
  const insert = h.calls[1].operations.find(op => op[0] === 'insert')[1]
  assert.equal(insert.sender_profile_id, userId)
  assert.equal(insert.body, 'Hello')
})
test('read updates exclude own and already-read messages', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [ok([{ id: applicationId }])])
  await h.exports.markConversationMessagesAsRead(applicationId)
  assert.ok(h.calls[0].operations.some(op => op[0] === 'neq' && op[1] === 'sender_profile_id' && op[2] === userId))
  assert.ok(h.calls[0].operations.some(op => op[0] === 'is' && op[1] === 'read_at' && op[2] === null))
})
test('redirects accept local paths and reject executable or external destinations', () => {
  const { safeRedirectPath } = load('lib/auth/redirectPath.ts', {})
  for (const unsafe of [null, '', 'javascript:alert(1)', 'https://example.com', '//example.com', '/\\example.com', '/\nexample.com']) assert.equal(safeRedirectPath(unsafe), '/')
  assert.equal(safeRedirectPath('/projects/example?tab=applications'), '/projects/example?tab=applications')
})

for (const role of ['client', 'engineer']) {
  const pageFile = `app/(${role})/${role}/messages/page.tsx`
  const pageMocks = {
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { redirect: (p) => { throw new Error(`redirect:${p}`) } },
    '@/components/messaging/InboxView': { InboxView: 'InboxView' },
  }
  test(`${role} inbox preserves unauthenticated and wrong-role redirects`, async () => {
    const h = harness(pageFile, [], false, pageMocks)
    await assert.rejects(h.exports.default(), /redirect:\/login/)
    const w = harness(pageFile, [ok({ role: 'admin' })], true, pageMocks)
    await assert.rejects(w.exports.default(), /redirect:\/$/)
  })
  test(`${role} inbox distinguishes profile query failure from onboarding`, async () => {
    const h = harness(pageFile, [ok({ role }), fail], true, pageMocks)
    const alert = await h.exports.default()
    assert.equal(alert.props.role, 'alert')
    assert.match(JSON.stringify(alert), /Messages are temporarily unavailable/)
    const m = harness(pageFile, [ok({ role }), ok(null)], true, pageMocks)
    const onboarding = await m.exports.default()
    assert.match(JSON.stringify(onboarding), new RegExp(`/${role}/profile`))
    assert.equal(m.calls.length, 2)
    assert.equal(m.calls.some(c => c.operations.some(op => op[0] === 'insert')), false)
  })
  test(`${role} inbox preserves conversation error handling`, async () => {
    const h = harness(pageFile, [ok({ role }), ok({ id: engineerId }), fail], true, pageMocks)
    const inbox = await h.exports.default()
    assert.equal(inbox.type, 'InboxView')
    assert.equal(inbox.props.loadError, 'generic')
    assert.equal(inbox.props.conversations.length, 0)
  })
}

test('conversation creation denies unrelated or ineligible relationships without inserts', async () => {
  for (const context of [null, { client_user_id: 'other-client', engineer_user_id: 'other-engineer' }]) {
    const h = harness('lib/messaging/messagingActions.ts', [ok(context)])
    assert.match((await h.exports.getOrCreateConversation(projectId, engineerId)).error, /not authorized/)
    assert.equal(h.calls.length, 1)
    assert.equal(h.calls[0].rpc, 'project_messaging_context')
  }
})

test('conversation context errors do not create conversations or expose diagnostics', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [fail])
  assert.match((await h.exports.getOrCreateConversation(projectId, engineerId)).error, /Could not load/)
  assert.equal(h.calls.length, 1)
})

const messagingContext = {
  project_id: projectId, client_profile_id: clientId, engineer_profile_id: engineerId,
  client_user_id: userId, engineer_user_id: 'other-engineer',
}
test('private counterpart context starts a conversation using canonical identifiers', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [ok(messagingContext), ok(null), ok({ id: applicationId })])
  assert.equal((await h.exports.getOrCreateConversation(projectId, engineerId)).conversationId, applicationId)
  const insert = h.calls[2].operations.find(op => op[0] === 'insert')[1]
  assert.equal(insert.client_profile_id, clientId)
  assert.equal(insert.engineer_profile_id, engineerId)
  assert.equal(h.calls.some(c => ['client_profiles', 'engineer_profiles'].includes(c.table)), false)
})

test('duplicate conversation race resolves to the existing conversation', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [
    ok(messagingContext), ok(null),
    { data: null, error: { code: '23505' } }, ok({ id: applicationId }),
  ])
  assert.equal((await h.exports.getOrCreateConversation(projectId, engineerId)).conversationId, applicationId)
})

test('new-project page does not create profiles after a failed SELECT or pass auth IDs as profile IDs', async () => {
  const mocks = {
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { redirect: (p) => { throw new Error(`redirect:${p}`) } },
    'lucide-react': { ArrowLeft: 'ArrowLeft' },
    './ProjectCreateForm': { ProjectCreateForm: 'ProjectCreateForm' },
  }
  const h = harness('app/(client)/client/projects/new/page.tsx', [ok({ role: 'client' }), fail], true, mocks)
  const alert = await h.exports.default()
  assert.equal(alert.props.role, 'alert')
  assert.equal(h.calls.length, 2)
  const missing = harness('app/(client)/client/projects/new/page.tsx', [ok({ role: 'client' }), ok(null), fail], true, mocks)
  const setupError = await missing.exports.default()
  assert.equal(setupError.props.role, 'alert')
  assert.doesNotMatch(JSON.stringify(setupError), /ProjectCreateForm/)
})
test('message read failures are reported without cache invalidation', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [fail])
  assert.ok((await h.exports.markConversationMessagesAsRead(applicationId)).error)
  assert.equal(h.invalidations.length, 0)
})

test('mounted conversation uses refreshed message props instead of retaining an old thread', () => {
  const state = []
  let cursor = 0
  const { ConversationView } = load('components/messaging/ConversationView.tsx', {
    react: {
      useState(initial) {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (value) => { state[index] = value }]
      },
      useEffect() {},
      useTransition: () => [false, () => {}],
    },
    'next/link': { __esModule: true, default: 'a' },
    'lucide-react': Object.fromEntries(['ArrowLeft', 'Send', 'FolderKanban', 'CheckCheck', 'Loader2', 'AlertCircle'].map(name => [name, name])),
    '@/lib/messaging/messagingActions': {},
  })
  const props = {
    conversationId: applicationId, projectId, projectTitle: 'Test project',
    participantName: 'Client', participantRole: 'Client', currentUserId: userId, role: 'engineer',
  }
  const oldMessage = { id: 'old', sender_profile_id: 'other', body: 'Old thread body', created_at: '2026-10-14T10:00:00Z', read_at: null }
  assert.match(JSON.stringify(ConversationView({ ...props, initialMessages: [oldMessage] })), /Old thread body/)
  cursor = 0
  const refreshed = JSON.stringify(ConversationView({ ...props, initialMessages: [{ ...oldMessage, id: 'new', body: 'Refreshed thread body' }] }))
  assert.match(refreshed, /Refreshed thread body/)
  assert.doesNotMatch(refreshed, /Old thread body/)
})

// Execute the actual proxy with session refresh and response-cookie boundaries.
function proxyHarness(role, signedIn = true, authError = null) {
  const jar = []
  const response = () => ({ cookies: {
    set(cookie) { jar.push(cookie) }, getAll() { return [{ name: 'session', value: 'refreshed' }] },
  } })
  const { default: proxy } = load('proxy.ts', {
    '@/lib/supabase/sessionCookies': { filterInvalidAuthCookies: cookies => ({ cookies, invalidNames: [] }) },
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({
      auth: { getUser: async () => {
        options.cookies.setAll([{ name: 'session', value: 'refreshed', options: { httpOnly: true } }])
        return { data: { user: signedIn ? { id: userId } : null }, error: authError }
      } },
      from: () => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ok(role ? { role } : null) }),
    }) },
    'next/server': { NextResponse: {
      next: response,
      redirect: url => ({ ...response(), location: url.pathname, search: url.search }),
    } },
  })
  return { jar, run: pathname => {
    const url = new URL('http://localhost' + pathname)
    url.clone = () => new URL(url)
    return proxy({ nextUrl: url, cookies: { getAll: () => [], set() {} } })
  } }
}

test('malformed encoded session cookies are filtered before SSR initialization without discarding valid chunks or PKCE', () => {
  const { filterInvalidAuthCookies } = load('lib/supabase/sessionCookies.ts', { '@supabase/ssr': require('@supabase/ssr') })
  const { stringToBase64URL } = require('@supabase/ssr')
  const url = 'http://127.0.0.1:54321'
  const key = 'sb-127-auth-token'
  const valid = 'base64-' + stringToBase64URL(JSON.stringify({ access_token: 'fixture', refresh_token: 'fixture' }))
  const good = [{ name: key + '.0', value: valid.slice(0, 12) }, { name: key + '.1', value: valid.slice(12) },
    { name: key + '-code-verifier', value: 'legacy-pkce-verifier' }, { name: 'theme', value: 'dark' }]
  assert.equal(filterInvalidAuthCookies(good, url).cookies.length, good.length)
  const bad = [{ name: key + '.0', value: 'base64-inv' }, { name: key + '.1', value: 'alid' }, good[2], good[3]]
  const filtered = filterInvalidAuthCookies(bad, url)
  assert.equal(filtered.invalidNames.length, 2)
  assert.equal(filtered.cookies.length, 2)
  assert.equal(filtered.cookies[0].name, key + '-code-verifier')
  assert.equal(filterInvalidAuthCookies([{ name: key, value: 'base64-invalid' }], url).cookies.length, 0)
})

test('missing canonical role exits protected routes without a redirect loop', async () => {
  const h = proxyHarness(null)
  const result = await h.run('/client/dashboard')
  assert.equal(result.location, '/account-unavailable')
  assert.equal((await h.run('/account-unavailable')).location, undefined)
  assert.equal((await h.run('/login')).location, '/account-unavailable')
})

test('proxy redirects preserve refreshed session cookies and segment boundaries', async () => {
  const h = proxyHarness('engineer')
  assert.equal((await h.run('/client/projects?private=value')).location, '/engineer/dashboard')
  assert.equal(h.jar.at(-1).name, 'session')
  assert.equal(h.jar.at(-1).value, 'refreshed')
  assert.equal((await h.run('/engineers')).location, undefined)
  const guest = proxyHarness(null, false)
  const result = await guest.run('/client/projects')
  assert.equal(result.location, '/login')
  assert.match(result.search, /redirect=%2Fclient%2Fprojects/)
})

for (const action of ['rejectProjectApplication', 'withdrawProjectApplication']) {
  test(action + ' succeeds only with a matching pending row', async () => {
    const responses = action === 'rejectProjectApplication'
      ? [...review().slice(0, 3), ok({ id: applicationId })]
      : [ok({ role: 'engineer' }), ok({ id: engineerId }), ok({ id: applicationId })]
    const h = harness(actionsFile, responses)
    assert.ok((await h.exports[action](projectId, applicationId)).success)
    assert.ok(h.calls.at(-1).operations.some(op => op[0] === 'eq' && op[1] === 'status' && op[2] === 'pending'))
    assert.ok(h.invalidations.includes('/projects/' + projectId))
  })
}

test('invalid sessions fail closed for marketplace and messaging actions even if user data is present', async () => {
  const h = harness(actionsFile, [], true, {}, { message: 'expired session' })
  for (const action of ['acceptProjectApplication', 'rejectProjectApplication', 'withdrawProjectApplication']) {
    assert.ok((await h.exports[action](projectId, applicationId)).error)
  }
  assert.ok((await h.exports.submitProjectApplication({}, form())).error)
  assert.equal(h.calls.length, 0)
  const m = harness('lib/messaging/messagingActions.ts', [], true, {}, { message: 'expired session' })
  assert.ok((await m.exports.getOrCreateConversation(projectId, engineerId)).error)
  assert.ok((await m.exports.sendMessage(applicationId, 'Hello')).error)
  assert.ok((await m.exports.markConversationMessagesAsRead(applicationId)).error)
  assert.equal(m.calls.length, 0)
})

test('invalid session redirects to login and keeps destination query inside the redirect parameter', async () => {
  const h = proxyHarness('client', true, { message: 'invalid token' })
  const result = await h.run('/client/projects?status=planned')
  assert.equal(result.location, '/login')
  const params = new URLSearchParams(result.search)
  assert.equal(params.get('redirect'), '/client/projects?status=planned')
  assert.equal(params.has('status'), false)
})

test('submission succeeds and binds only the signed-in engineer identity', async () => {
  const h = harness(actionsFile, [...submission(), ok(null)])
  const data = form()
  data.set('engineer_profile_id', 'forged-engineer')
  assert.ok((await h.exports.submitProjectApplication({}, data)).success)
  assert.equal(h.calls.at(-1).operations.find(op => op[0] === 'insert')[1].engineer_profile_id, engineerId)
  assert.ok(h.invalidations.includes('/projects/' + projectId))
})

test('missing projects and cross-project applications never reach acceptance RPC', async () => {
  for (const responses of [review(null).slice(0, 3), review(owned, null)]) {
    const h = harness(actionsFile, responses)
    assert.ok((await h.exports.acceptProjectApplication(projectId, applicationId)).error)
    assert.equal(h.calls.some(c => c.rpc), false)
    const applicationQuery = h.calls.find(c => c.table === 'project_applications')
    if (applicationQuery) assert.ok(applicationQuery.operations.some(op => op[0] === 'eq' && op[1] === 'project_id' && op[2] === projectId))
  }
})

test('messaging validates references, recipients and message lengths before queries', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [])
  assert.ok((await h.exports.getOrCreateConversation(projectId, 'bad-recipient')).error)
  for (const [id, body] of [['invalid', 'hello'], [applicationId, ' '], [applicationId, 'x'.repeat(2001)]]) {
    assert.ok((await h.exports.sendMessage(id, body)).error)
  }
  assert.equal(h.calls.length, 0)
})

test('existing conversations are reused and send failures expose no database diagnostics', async () => {
  const existing = harness('lib/messaging/messagingActions.ts', [ok(messagingContext), ok({ id: applicationId })])
  assert.equal((await existing.exports.getOrCreateConversation(projectId, engineerId)).conversationId, applicationId)
  assert.equal(existing.calls.length, 2)
  const failed = harness('lib/messaging/messagingActions.ts', [ok({ engineer_profile: [{ profile_id: userId }] }), fail])
  const result = await failed.exports.sendMessage(applicationId, 'Hello')
  assert.match(result.error, /Could not send/)
  assert.doesNotMatch(result.error, /database failure/)
  assert.equal(failed.invalidations.length, 0)
})

test('missing messaging RPCs are recognized as missing schema', () => {
  const { missingMessagingSchema } = load('lib/messaging/messagingErrors.ts', {})
  for (const code of ['PGRST202', '42883', '42P01']) assert.equal(missingMessagingSchema({ code }), true)
  assert.equal(missingMessagingSchema({ code: 'XX000' }), false)
})

for (const role of ['client', 'engineer']) {
  test(`${role} inbox displays private participant cards and reports card lookup errors`, async () => {
    const mocks = {
      'next/link': { __esModule: true, default: 'a' },
      'next/navigation': { redirect: p => { throw new Error(`redirect:${p}`) } },
      '@/components/messaging/InboxView': { InboxView: 'InboxView' },
    }
    for (const response of [ok([{ conversation_id: applicationId, [`${role === 'client' ? 'engineer' : 'client'}_name`]: 'Private counterpart' }]), fail]) {
      const h = harness(`app/(${role})/${role}/messages/page.tsx`, [
        ok({ role }), ok({ id: role === 'client' ? clientId : engineerId }),
        ok([{ id: applicationId, messages: [], updated_at: '2026-10-22T00:00:00Z' }]), response,
      ], true, mocks)
      const result = await h.exports.default()
      assert.equal(result.props.loadError, response.error ? 'generic' : null)
      if (!response.error) assert.equal(result.props.conversations[0].participant_name, 'Private counterpart')
    }
  })
}

// A tiny hook boundary exercises real form handlers without a browser or a
// database. These tests do not claim DOM, email delivery or Supabase coverage.
function clientFormHarness(file, auth = {}, options = {}) {
  const states = []
  const refs = []
  let stateCursor = 0
  let refCursor = 0
  const navigations = []
  const timers = []
  const queryCalls = []
  const responses = [...(options.responses || [])]
  const supabase = {
    auth,
    from(table) {
      const call = { table, operations: [] }
      queryCalls.push(call)
      const query = {}
      for (const method of ['select', 'insert', 'eq']) query[method] = (...args) => { call.operations.push([method, ...args]); return query }
      const finish = async () => {
        assert.ok(responses.length, 'Unexpected form query')
        const response = responses.shift()
        if (response instanceof Error) throw response
        return response
      }
      query.single = finish
      query.maybeSingle = finish
      return query
    },
  }
  const exports = load(file, {
    react: {
      Suspense: 'Suspense',
      useState(initial) {
        const index = stateCursor++
        if (!(index in states)) states[index] = initial
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value }]
      },
      useRef(initial) { const index = refCursor++; return refs[index] ??= { current: initial } },
    },
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': {
      useRouter: () => ({ push: p => navigations.push(p), replace: p => navigations.push(p), refresh() {} }),
      useSearchParams: () => new URLSearchParams(options.search || ''),
    },
    'lucide-react': new Proxy({}, { get: (_target, name) => name }),
    '@/lib/supabase/client': { createClient: () => supabase },
    '@/lib/auth/redirectPath': load('lib/auth/redirectPath.ts', {}),
  }, {
    window: { location: { origin: 'http://localhost:3000' } },
    crypto: { randomUUID: () => projectId },
    setTimeout: callback => { timers.push(callback) },
  })
  return {
    states, navigations, queryCalls, timers,
    render() {
      stateCursor = 0; refCursor = 0
      let tree = exports.ProjectCreateForm
        ? exports.ProjectCreateForm({ clientProfileId: clientId, clientName: 'Client' })
        : exports.default()
      if (tree.type === 'Suspense') tree = tree.props.children.type()
      return tree
    },
  }
}

function findElement(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined
  if (predicate(tree)) return tree
  const children = tree.props?.children
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const result = findElement(child, predicate)
    if (result) return result
  }
}
const formElement = tree => findElement(tree, element => element.type === 'form')
const submitEvent = { preventDefault() {} }

for (const role of ['client', 'engineer', 'admin', null]) {
  test(`login uses canonical role ${role} and ignores admin metadata`, async () => {
    const h = clientFormHarness('app/(auth)/login/page.tsx', {
      signInWithPassword: async () => ok({ user: { id: userId, user_metadata: { role: 'admin' } } }),
    }, { responses: [ok(role ? { role } : null)] })
    await formElement(h.render()).props.onSubmit(submitEvent)
    assert.equal(h.navigations[0], role ? `/${role}/dashboard` : '/account-unavailable')
  })
}

test('login failure does not navigate or query profiles', async () => {
  const h = clientFormHarness('app/(auth)/login/page.tsx', { signInWithPassword: async () => fail })
  await formElement(h.render()).props.onSubmit(submitEvent)
  assert.equal(h.navigations.length, 0)
  assert.equal(h.queryCalls.length, 0)
})

test('password reset requests return through the local callback and update page', async () => {
  let redirect
  const h = clientFormHarness('app/(auth)/forgot-password/page.tsx', {
    resetPasswordForEmail: async (_email, options) => { redirect = options.redirectTo; return ok(null) },
  })
  await formElement(h.render()).props.onSubmit(submitEvent)
  assert.equal(redirect, 'http://localhost:3000/api/auth/callback?next=/update-password')
  assert.match(JSON.stringify(h.render()), /Check your email/)
})

for (const [name, password, confirmation, validSession, updateError] of [
  ['short', 'short', 'short', true, false],
  ['mismatch', 'long-password', 'different', true, false],
  ['expired', 'long-password', 'long-password', false, false],
  ['server failure', 'long-password', 'long-password', true, true],
  ['success', 'long-password', 'long-password', true, false],
]) {
  test('password update handles ' + name, async () => {
    let updates = 0
    const h = clientFormHarness('app/(auth)/update-password/page.tsx', {
      getUser: async () => ({ data: { user: validSession ? { id: userId } : null }, error: validSession ? null : { message: 'expired' } }),
      updateUser: async args => { updates++; assert.equal(args.password, password); return updateError ? fail : ok(null) },
    })
    let tree = h.render()
    findElement(tree, e => e.props?.id === 'password').props.onChange({ target: { value: password } })
    findElement(tree, e => e.props?.id === 'confirmation').props.onChange({ target: { value: confirmation } })
    tree = h.render()
    await formElement(tree).props.onSubmit(submitEvent)
    const result = h.render()
    if (name === 'success') assert.match(JSON.stringify(result), /Your password has been updated/)
    else assert.ok(findElement(result, e => e.props?.role === 'alert'))
    assert.equal(updates, ['server failure', 'success'].includes(name) ? 1 : 0)
  })
}

test('account-unavailable sign out handles transport failures and permits a retry', async () => {
  let attempts = 0
  const h = clientFormHarness('app/(auth)/account-unavailable/page.tsx', {
    signOut: async () => { if (++attempts === 1) throw new Error('network'); return ok(null) },
  })
  await findElement(h.render(), e => e.type === 'button').props.onClick()
  assert.ok(findElement(h.render(), e => e.props?.role === 'alert'))
  assert.equal(findElement(h.render(), e => e.type === 'button').props.disabled, false)
  await findElement(h.render(), e => e.type === 'button').props.onClick()
  assert.equal(h.navigations[0], '/login')
})

test('project form rejects missing fields and inverted dates before database writes', async () => {
  for (const values of [[], ['Title'], ['Title', 'Other'], ['Title', 'Other', 'Custom', '', 'planned', '2026-10-22', '2026-10-21', 'Description']]) {
    const h = clientFormHarness('app/(client)/client/projects/new/ProjectCreateForm.tsx')
    h.render()
    values.forEach((value, i) => { h.states[i] = value })
    await formElement(h.render()).props.onSubmit(submitEvent)
    assert.equal(h.queryCalls.length, 0)
    assert.ok(findElement(h.render(), e => e.props?.role === 'alert'))
  }
})

test('project form reuses its UUID after a lost response and confirms only an owned duplicate', async () => {
  const h = clientFormHarness('app/(client)/client/projects/new/ProjectCreateForm.tsx', {}, {
    responses: [new Error('response lost'), { data: null, error: { code: '23505' } }, ok({ id: projectId })],
  })
  h.render()
  h.states[0] = 'Title'; h.states[1] = 'Structural Design'; h.states[7] = 'Description'
  await formElement(h.render()).props.onSubmit(submitEvent)
  assert.equal(h.timers.length, 0)
  await formElement(h.render()).props.onSubmit(submitEvent)
  const inserts = h.queryCalls.filter(c => c.operations.some(op => op[0] === 'insert'))
  assert.equal(inserts.length, 2)
  for (const call of inserts) {
    const payload = call.operations.find(op => op[0] === 'insert')[1]
    assert.equal(payload.id, projectId)
    assert.equal(payload.client_profile_id, clientId)
    assert.equal(payload.engineer_profile_id, undefined)
  }
  assert.ok(h.queryCalls.at(-1).operations.some(op => op[0] === 'eq' && op[1] === 'client_profile_id' && op[2] === clientId))
  assert.equal(h.timers.length, 1)
  h.timers[0]()
  assert.equal(h.navigations[0], '/client/projects')
})

test('project form never reports success for an unconfirmed or unowned insert', async () => {
  for (const responses of [[ok(null)], [{ data: null, error: { code: '23505' } }, ok(null)]]) {
    const h = clientFormHarness('app/(client)/client/projects/new/ProjectCreateForm.tsx', {}, { responses })
    h.render()
    h.states[0] = 'Title'; h.states[1] = 'Structural Design'; h.states[7] = 'Description'
    await formElement(h.render()).props.onSubmit(submitEvent)
    assert.equal(h.timers.length, 0)
    assert.ok(findElement(h.render(), e => e.props?.role === 'alert'))
  }
})

for (const [name, code, user, role, next, expected] of [
  ['missing code', null, true, 'client', '', '/login?error=auth_callback_failed'],
  ['engineer', 'valid', true, 'engineer', '', '/engineer/dashboard'],
  ['missing role', 'valid', true, null, '', '/account-unavailable'],
  ['recovery', 'valid', true, 'client', '/update-password', '/update-password'],
  ['external redirect', 'valid', true, 'client', '//evil.example', '/client/dashboard'],
  ['invalid session', 'valid', false, 'admin', '/update-password', '/login?error=auth_callback_failed'],
]) {
  test('auth callback handles ' + name, async () => {
    const calls = []
    const { GET } = load('app/api/auth/callback/route.ts', {
      'next/server': { NextResponse: { redirect: url => url } },
      '@/lib/auth/redirectPath': load('lib/auth/redirectPath.ts', {}),
      '@/lib/supabase/server': { createClient: async () => ({
        auth: {
          exchangeCodeForSession: async value => { calls.push(value); return ok(null) },
          getUser: async () => ({ data: { user: user ? { id: userId, user_metadata: { role: 'admin' } } : null }, error: user ? null : { message: 'expired' } }),
        },
        from: () => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ok(role ? { role } : null) }),
      }) },
    })
    const url = new URL('http://localhost/api/auth/callback')
    if (code) url.searchParams.set('code', code)
    if (next) url.searchParams.set('next', next)
    assert.equal(await GET({ url: url.href }), 'http://localhost' + expected)
    assert.equal(calls.length, code ? 1 : 0)
  })
}

for (const role of ['client', 'engineer']) {
  test(`${role} thread distinguishes failed profile lookup, denies nonowners and displays private participants`, async () => {
    const mocks = {
      'next/navigation': {
        redirect: p => { throw new Error(`redirect:${p}`) },
        notFound: () => { throw new Error('notFound') },
      },
      '@/components/messaging/ConversationView': { ConversationView: 'ConversationView' },
      '@/components/messaging/MessagingUnavailable': { MessagingUnavailable: 'MessagingUnavailable' },
    }
    const file = `app/(${role})/${role}/messages/[id]/page.tsx`
    const params = { params: Promise.resolve({ id: applicationId }) }
    const failed = harness(file, [fail], true, mocks)
    assert.equal((await failed.exports.default(params)).type, 'MessagingUnavailable')
    const ownId = role === 'client' ? clientId : engineerId
    const otherRole = role === 'client' ? 'engineer' : 'client'
    const denied = harness(file, [ok({ id: ownId }), ok({ [`${role}_profile_id`]: 'other' })], true, mocks)
    await assert.rejects(denied.exports.default(params), /notFound/)
    const allowed = harness(file, [
      ok({ id: ownId }), ok({ id: applicationId, project_id: projectId, [`${role}_profile_id`]: ownId }),
      ok([{ conversation_id: applicationId, [`${otherRole}_name`]: 'Private person' }]), ok([]),
    ], true, mocks)
    const thread = await allowed.exports.default(params)
    assert.equal(thread.type, 'ConversationView')
    assert.equal(thread.props.participantName, 'Private person')
    const expired = harness(file, [], true, mocks, { message: 'expired' })
    await assert.rejects(expired.exports.default(params), /redirect:\/login/)
    assert.equal(expired.calls.length, 0)
  })

  test(`${role} dashboard authenticates, enforces role and renders its authorized workspace`, async () => {
    const componentNames = role === 'client'
      ? ['ClientDashboardHeader', 'ClientProfileCompletionCard', 'ClientQuickActions', 'ClientProjectsSummary']
      : ['DashboardHeader', 'ProfileCompletionCard', 'ProfileStatusCard', 'QuickActions', 'ProfilePreview', 'EngineerWorkspace']
    const mocks = { 'next/navigation': { redirect: p => { throw new Error(`redirect:${p}`) } } }
    for (const name of componentNames) mocks[`./components/${name}`] = { [name]: name }
    const file = `app/(${role})/${role}/dashboard/page.tsx`
    const guest = harness(file, [], false, mocks)
    await assert.rejects(guest.exports.default(), /redirect:\/login/)
    const wrong = harness(file, [ok({ role: 'admin' })], true, mocks)
    await assert.rejects(wrong.exports.default(), /redirect:\/$/)
    const allowed = harness(file, [ok({ id: userId, role }), ok(null), ok(null), ok(null)], true, mocks)
    assert.ok(await allowed.exports.default())
  })
}
