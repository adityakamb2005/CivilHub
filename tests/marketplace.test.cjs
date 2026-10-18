const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real TypeScript actions with a scripted Supabase boundary.
// These tests exercise application behavior, not PostgreSQL constraints or RLS.
function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(output, {
    module, exports: module.exports, FormData,
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

function harness(file, responses, authenticated = true, extra = {}) {
  const calls = []
  const invalidations = []
  let index = 0
  const db = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: userId } : null } }) },
    async rpc() {
      assert.fail('This migration-013 release must not call a database RPC')
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
// Mocked migration-013 control flow only; no PostgreSQL atomicity/RLS claim.
test('acceptance uses the existing assignment, decision and competitor requests without RPC', async () => {
  const h = harness(actionsFile, [...review(), ok({ id: projectId }), ok({ id: applicationId }), ok([])])
  assert.equal((await h.exports.acceptProjectApplication(projectId, applicationId)).success, 'Engineer accepted and assigned.')
  assert.equal(h.calls.length, 7)
  assert.deepEqual(h.calls.filter(c => c.operations.some(op => op[0] === 'update')).map(c => c.table), ['projects', 'project_applications', 'project_applications'])
  assert.ok(h.calls[4].operations.some(op => op[0] === 'is' && op[1] === 'engineer_profile_id' && op[2] === null))
  assert.ok(h.calls[4].operations.some(op => op[0] === 'eq' && op[1] === 'client_profile_id' && op[2] === clientId))
  assert.ok(h.calls[5].operations.some(op => op[0] === 'eq' && op[1] === 'project_id' && op[2] === projectId))
  assert.ok(h.calls[6].operations.some(op => op[0] === 'neq' && op[1] === 'id' && op[2] === applicationId))
  assert.ok(h.calls[6].operations.some(op => op[0] === 'eq' && op[1] === 'status' && op[2] === 'pending'))
  assert.ok(h.invalidations.includes('/engineer/projects'))
  assert.ok(h.invalidations.includes('/client/projects/' + projectId + '/applications'))
})

for (const response of [fail, ok(null)]) {
  test('failed or lost assignment claim stops before application status writes: ' + Boolean(response.error), async () => {
    const h = harness(actionsFile, [...review(), response])
    assert.match((await h.exports.acceptProjectApplication(projectId, applicationId)).error, /assignment could not be saved/)
    assert.equal(h.calls.length, 5)
    assert.equal(h.invalidations.length, 0)
  })
  test('failed or zero-row acceptance reports partial assignment honestly: ' + Boolean(response.error), async () => {
    const h = harness(actionsFile, [...review(), ok({ id: projectId }), response])
    assert.match((await h.exports.acceptProjectApplication(projectId, applicationId)).error, /assigned.*status could not be saved/)
    assert.equal(h.calls.length, 6)
    assert.ok(h.invalidations.includes('/engineer/projects'))
  })
}

test('competitor failure is reported as a partial result, not atomic success', async () => {
  const h = harness(actionsFile, [...review(), ok({ id: projectId }), ok({ id: applicationId }), fail])
  const result = await h.exports.acceptProjectApplication(projectId, applicationId)
  assert.match(result.error, /competing applications could not be closed/)
  assert.equal(result.success, undefined)
  assert.equal(h.calls.length, 7)
})

for (const status of ['planned', 'completed']) {
  test('same-engineer accepted retry preserves the assignment on ' + status + ' project', async () => {
    const h = harness(actionsFile, [...review({ ...owned, status, engineer_profile_id: engineerId }, { ...pending, status: 'accepted' }), ok({ id: applicationId }), ok([])])
    assert.ok((await h.exports.acceptProjectApplication(projectId, applicationId)).success)
    assert.equal(h.calls.filter(c => c.table === 'projects').length, 1)
    assert.equal(h.calls.length, 6)
  })
}

test('release action and database types have no migration-016 RPC dependency', () => {
  const action = fs.readFileSync(path.join(__dirname, '..', actionsFile), 'utf8')
  const types = fs.readFileSync(path.join(__dirname, '..', 'types/database.ts'), 'utf8')
  assert.doesNotMatch(action, /\.rpc\s*\(/)
  assert.doesNotMatch(action + types, /accept_project_application/)
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

test('conversation creation denies an unrelated user before eligibility queries', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [
    ok({ id: projectId, client_profile_id: clientId }),
    ok({ id: clientId, profile_id: 'other-client' }),
    ok({ id: engineerId, profile_id: 'other-engineer' }),
  ])
  assert.match((await h.exports.getOrCreateConversation(projectId, engineerId)).error, /not authorized/)
  assert.equal(h.calls.length, 3)
})
test('conversation creation denies a participant without application or assignment', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [
    ok({ id: projectId, client_profile_id: clientId, engineer_profile_id: null }),
    ok({ id: clientId, profile_id: userId }),
    ok({ id: engineerId, profile_id: 'other-engineer' }), ok(null),
  ])
  assert.match((await h.exports.getOrCreateConversation(projectId, engineerId)).error, /application or assignment/)
  assert.equal(h.calls.length, 4)
})
test('duplicate conversation race resolves to the existing conversation', async () => {
  const h = harness('lib/messaging/messagingActions.ts', [
    ok({ id: projectId, client_profile_id: clientId, engineer_profile_id: engineerId }),
    ok({ id: clientId, profile_id: userId }),
    ok({ id: engineerId, profile_id: 'other-engineer' }), ok(null),
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
