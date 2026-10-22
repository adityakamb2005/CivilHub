"""Opt-in release checks; requires the existing isolated Python/Supabase setup.

Run with atomic-db-test/.venv/Scripts/python.exe. Secrets stay in memory.
No hosted targets, schema resets, migrations or existing project changes.
Browser/all phases rotate passwords for the four dedicated disposable accounts.
Database/concurrency phases never rotate passwords. Browser/HTTP checks always
create a fresh local production build; cached-build reuse is not supported.
"""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import re
import subprocess
import threading
import time
import uuid
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg
from psycopg.conninfo import conninfo_to_dict

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT.parent / "atomic-db-test"
IDS = {"client": "11111111-1111-4111-8111-111111111111",
       "engineer": "22222222-2222-4222-8222-222222222222",
       "rival": "33333333-3333-4333-8333-333333333333",
       "admin": "44444444-4444-4444-8444-444444444444"}
EMAILS = {role: f"civilhub-test-{role}@example.invalid" for role in IDS}
RESULTS = {}
SECRETS = []
PROJECTS = []
TOKENS = {}
CONFIG = {}


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def record(category, name, operation):
    counts = RESULTS.setdefault(category, {"passed": 0, "failed": 0, "skipped": 0})
    try:
        operation()
        counts["passed"] += 1
        print(f"PASS {category}: {name}", flush=True)
        return True
    except Exception as error:
        counts["failed"] += 1
        message = str(error)
        for secret in SECRETS:
            if secret:
                message = message.replace(secret, "[redacted]")
        print(f"FAIL {category}: {name}: {type(error).__name__}: {message[:650]}", flush=True)
        return False


def connection_parameters(dsn, environ):
    """Accept only the CLI's simple, single-host local URI; never log the URI."""
    try:
        address = urlparse(dsn)
        if (address.scheme not in ["postgres", "postgresql"] or address.hostname != "127.0.0.1"
                or address.port != 54322 or address.path != "/postgres" or address.query or address.fragment
                or any(key.upper().startswith("PG") and value for key, value in environ.items())):
            raise ValueError()
        parameters = conninfo_to_dict(dsn)
        if (set(parameters) - {"user", "password", "host", "port", "dbname"}
                or parameters.get("host") != "127.0.0.1" or parameters.get("port") != "54322"
                or parameters.get("dbname") != "postgres" or parameters.get("user") != "postgres"):
            raise ValueError()
    except Exception:
        raise ValueError("Refusing unexpected PostgreSQL routing or libpq environment configuration") from None
    return {"host": "127.0.0.1", "hostaddr": "127.0.0.1", "port": 54322,
            "dbname": "postgres", "user": "postgres", "password": parameters.get("password", ""),
            "connect_timeout": 5, "passfile": os.devnull}


def verify_container_port(container, internal_port, host_port):
    output = subprocess.check_output(["docker", "inspect", "--format", "{{json .NetworkSettings.Ports}}", container],
                                     text=True, timeout=15)
    bindings = json.loads(output).get(internal_port, [])
    check(any(binding["HostPort"] == str(host_port) and binding["HostIp"] in
              ["127.0.0.1", "0.0.0.0", "::", "::1"] for binding in bindings),
          "Expected isolated container port mapping is absent")


def configure():
    result = subprocess.run(["npx.cmd", "--no-install", "supabase", "status", "--workdir", str(LOCAL), "-o", "json"],
                            capture_output=True, text=True, encoding="utf-8", errors="replace", check=True, timeout=60)
    CONFIG.update(json.loads(result.stdout))
    SECRETS.extend(str(value) for key, value in CONFIG.items() if any(word in key for word in ["KEY", "SECRET", "DB_URL"]))
    parameters = connection_parameters(CONFIG["DB_URL"], os.environ)
    SECRETS.append(parameters["password"])
    check(CONFIG["API_URL"] == "http://127.0.0.1:54321", "Refusing non-isolated Supabase API")
    containers = subprocess.check_output(["docker", "ps", "--format", "{{.Names}}"], text=True, timeout=15).splitlines()
    check("supabase_db_civilhub-atomic-db-test" in containers and "supabase_auth_civilhub-atomic-db-test" in containers,
          "Expected isolated containers are not running")
    verify_container_port("supabase_db_civilhub-atomic-db-test", "5432/tcp", 54322)
    verify_container_port("supabase_kong_civilhub-atomic-db-test", "8000/tcp", 54321)


def connect(actor=None):
    parameters = connection_parameters(CONFIG["DB_URL"], os.environ)
    connection = psycopg.connect(**parameters)
    try:
        connection.execute("SET statement_timeout='20s'")
        connection.execute("SET lock_timeout='15s'")
        if actor:
            connection.execute("SET LOCAL ROLE authenticated")
            connection.execute("SELECT set_config('request.jwt.claim.sub',%s,true)", (IDS[actor],))
        return connection
    except Exception:
        connection.close()
        raise


def sql(query, args=()):
    with connect() as connection:
        return connection.execute(query, args).fetchall()


def fixture(two=True):
    project = str(uuid.uuid4())
    title = "Release validation " + project
    with connect("client") as connection:
        owner = connection.execute("SELECT id FROM public.client_profiles WHERE profile_id=%s", (IDS["client"],)).fetchone()[0]
        connection.execute("INSERT INTO public.projects(id,title,description,project_type,status,is_published,client_profile_id) VALUES (%s,%s,'Disposable release fixture','Other','planned',true,%s)", (project, title, owner))
    PROJECTS.append((project, title))
    applications = []
    for role in (["engineer", "rival"] if two else ["engineer"]):
        application = str(uuid.uuid4())
        with connect(role) as connection:
            engineer = connection.execute("SELECT id FROM public.engineer_profiles WHERE profile_id=%s", (IDS[role],)).fetchone()[0]
            connection.execute("INSERT INTO public.project_applications(id,project_id,engineer_profile_id,cover_message) VALUES (%s,%s,%s,'Disposable release application message')", (application, project, engineer))
        applications.append(application)
    return project, applications, title


def accept(connection, project, application):
    connection.execute("SELECT public.accept_project_application(%s::uuid,%s::uuid)", (project, application))
    return "accepted"


def decision(connection, application, status):
    return len(connection.execute("UPDATE public.project_applications SET status=%s WHERE id=%s AND status='pending' RETURNING id", (status, application)).fetchall())


def state(project):
    rows = sql("SELECT p.engineer_profile_id,a.engineer_profile_id,a.status,p.status FROM public.projects p JOIN public.project_applications a ON a.project_id=p.id WHERE p.id=%s ORDER BY a.id", (project,))
    winners = [row for row in rows if row[2] == "accepted"]
    check(len(winners) <= 1, "Multiple accepted applications")
    check((not winners and rows[0][0] is None) or (len(winners) == 1 and winners[0][0] == winners[0][1]), "Assignment/status mismatch")
    return rows


def race(first, second, actor="client", first_actor=None):
    """Start the second operation only after the first holds real DB locks."""
    held = connect(first_actor or ("client" if first[0] != "withdraw" else "engineer"))
    worker = None
    held_pid = held.info.backend_pid
    try:
        worker = connect(actor)
        pid = worker.info.backend_pid
        first[1](held)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            def execute():
                try:
                    value = second(worker)
                    worker.commit()
                    return ("ok", value)
                except psycopg.Error as error:
                    worker.rollback()
                    return ("error", error.sqlstate)
            future = pool.submit(execute)
            deadline = time.monotonic() + 10
            blocked = False
            while time.monotonic() < deadline:
                blockers = sql("SELECT pg_blocking_pids(%s)", (pid,))[0][0]
                if held_pid in blockers:
                    blocked = True
                    break
                if future.done():
                    break
                threading.Event().wait(0.02)
            if not blocked:
                held.rollback()
                future.result(timeout=25)
                raise AssertionError("The competing connection never reached the expected database lock")
            held.commit()
            return future.result(timeout=25)
    finally:
        held.close()
        if worker is not None:
            worker.close()


def concurrency():
    def run(kind):
        project, apps, title = fixture()
        if kind == "rival accept":
            result = race(("accept", lambda c: accept(c, project, apps[0])), lambda c: accept(c, project, apps[1]))
            check(result == ("error", "PA003"), "Competing acceptance did not fail safely")
        elif kind == "same application":
            result = race(("accept", lambda c: accept(c, project, apps[0])), lambda c: accept(c, project, apps[0]))
            check(result[0] == "ok", "Accepted retry was not idempotent")
        elif kind in ["accept then reject", "accept then withdraw"]:
            status = "withdrawn" if "withdraw" in kind else "rejected"
            result = race(("accept", lambda c: accept(c, project, apps[0])), lambda c: decision(c, apps[0], status),
                          "engineer" if status == "withdrawn" else "client")
            check(result == ("ok", 0), "Finalized acceptance was overwritten")
        elif kind.endswith("then accept") and kind.split()[0] in ["reject", "withdraw"]:
            status = "withdrawn" if kind.startswith("withdraw") else "rejected"
            result = race(("withdraw" if status == "withdrawn" else "reject", lambda c: decision(c, apps[0], status)), lambda c: accept(c, project, apps[0]))
            check(result == ("error", "PA003"), "Ineligible application was accepted")
        elif kind in ["completed then accept", "on_hold then accept"]:
            status = kind.split()[0]
            result = race(("close", lambda c: c.execute("UPDATE public.projects SET status=%s WHERE id=%s", (status, project))), lambda c: accept(c, project, apps[0]))
            check(result == ("error", "PA005"), "Inactive project was accepted")
        elif kind == "accept then completed":
            result = race(("accept", lambda c: accept(c, project, apps[0])), lambda c: c.execute("UPDATE public.projects SET status='completed' WHERE id=%s", (project,)).rowcount)
            check(result == ("ok", 1), "Authorized later project completion failed")
        elif kind == "unpublish then accept":
            result = race(("unpublish", lambda c: c.execute("UPDATE public.projects SET is_published=false WHERE id=%s", (project,))), lambda c: accept(c, project, apps[0]))
            check(result[0] == "ok", "Existing active application should remain acceptable after unpublishing")
        else:
            raise ValueError("Unknown concurrency scenario")
        rows = state(project)
        if kind == "accept then completed":
            check(all(row[3] == "completed" for row in rows) and sum(row[2] == "accepted" for row in rows) == 1,
                  "Project completion or accepted assignment was not preserved")
        count = sql("SELECT count(*) FROM public.notifications WHERE type='application_accepted' AND body LIKE %s", ('%"' + title + '"%',))[0][0]
        check(count == sum(row[2] == "accepted" for row in rows), "Duplicate or missing acceptance notification")
    for kind in ["rival accept", "same application", "accept then reject", "reject then accept", "accept then withdraw", "withdraw then accept", "completed then accept", "on_hold then accept", "accept then completed", "unpublish then accept"]:
        record("Concurrency", kind, lambda kind=kind: run(kind))
    def duplicate_conversation():
        project, _, _ = fixture(two=False)
        owner = sql("SELECT id FROM public.client_profiles WHERE profile_id=%s", (IDS["client"],))[0][0]
        engineer = sql("SELECT id FROM public.engineer_profiles WHERE profile_id=%s", (IDS["engineer"],))[0][0]
        def insert(connection):
            return connection.execute("INSERT INTO public.conversations(project_id,client_profile_id,engineer_profile_id) VALUES (%s,%s,%s) RETURNING id", (project, owner, engineer)).fetchone()[0]
        check(race(("conversation", insert), insert) == ("error", "23505"), "Duplicate conversation was not constrained")
        with connect("client") as connection:
            check(len(connection.execute("SELECT id FROM public.conversations WHERE project_id=%s", (project,)).fetchall()) == 1,
                  "Authorized duplicate recovery cannot read the unique conversation")
    record("Concurrency", "duplicate conversation creation and authorized recovery", duplicate_conversation)
    def submission_race(submit_first):
        project, apps, _ = fixture(two=False)
        engineer = sql("SELECT id FROM public.engineer_profiles WHERE profile_id=%s", (IDS["rival"],))[0][0]
        def submit(connection):
            return connection.execute("INSERT INTO public.project_applications(project_id,engineer_profile_id,cover_message) VALUES (%s,%s,'Concurrent disposable submission') RETURNING id", (project, engineer)).fetchone()[0]
        if submit_first:
            result = race(("submit", submit), lambda c: accept(c, project, apps[0]), first_actor="rival")
            check(result[0] == "ok", "Acceptance failed after earlier submission")
            rows = state(project)
            check(len(rows) == 2 and sum(row[2] == "rejected" for row in rows) == 1, "Acceptance missed the newly committed competitor")
        else:
            result = race(("accept", lambda c: accept(c, project, apps[0])), submit, actor="rival")
            check(result == ("error", "42501"), "Late submission committed after assignment")
            check(len(state(project)) == 1, "Unexpected late competitor persisted")
    for submit_first in [True, False]:
        record("Concurrency", "submission before acceptance" if submit_first else "acceptance before submission",
               lambda submit_first=submit_first: submission_race(submit_first))


def http(path, method="GET", body=None, role=None, admin=False):
    check(path.startswith("/") and not path.startswith("//"), "Invalid local API path")
    authorization = CONFIG["SERVICE_ROLE_KEY"] if admin else TOKENS.get(role, CONFIG["ANON_KEY"])
    request = Request(CONFIG["API_URL"] + path, method=method,
                      data=json.dumps(body).encode() if body is not None else None,
                      headers={"apikey": CONFIG["PUBLISHABLE_KEY"], "Authorization": "Bearer " + authorization, "Content-Type": "application/json", "Prefer": "return=representation"})
    try:
        with urlopen(request, timeout=15) as response:
            return response.status, json.loads(response.read() or b"null")
    except HTTPError as error:
        return error.code, json.loads(error.read() or b"null")


def authenticate():
    import secrets
    password = secrets.token_urlsafe(24)
    SECRETS.append(password)
    for role in list(IDS):
        code, account = http("/auth/v1/admin/users/" + IDS[role], admin=True)
        check(code == 200 and account["email"] == EMAILS[role], "Disposable account identity mismatch")
        code, _ = http("/auth/v1/admin/users/" + IDS[role], "PUT", {"password": password}, admin=True)
        check(code == 200, "Cannot establish local disposable credentials")
        code, session = http("/auth/v1/token?grant_type=password", "POST", {"email": EMAILS[role], "password": password})
        check(code == 200, "Local fixture authentication failed")
        TOKENS[role] = session["access_token"]
        SECRETS.append(session["access_token"])
    return password


def database_tests():
    def migration_history():
        versions = sql("SELECT version FROM supabase_migrations.schema_migrations ORDER BY version")
        expected = {"202601010000" + f"{number:02d}" for number in [*range(1, 14), 15, 16, 17]}
        check({row[0] for row in versions} == expected, "Unexpected local migration history")
        for source in (ROOT / "supabase/migrations").glob("*.sql"):
            copies = [LOCAL / "supabase/migrations" / ("202601010000" + f"{int(source.name[:3]):02d}" + source.name[3:])]
            check(len(copies) == 1 and copies[0].read_text(encoding="utf-8") == source.read_text(encoding="utf-8"), "Migration source drift: " + source.name)
    record("Database", "16 migration copies match current source; 014 absent", migration_history)
    for name, file in [("atomic acceptance", LOCAL / "atomic_project_acceptance_local.sql"), ("profile/RLS security", ROOT / "tests/sql/marketplace_profile_security.sql")]:
        def execute(file=file):
            command = ["docker", "exec", "-i", "supabase_db_civilhub-atomic-db-test", "psql", "-U", "postgres", "-d", "postgres", "-v", "isolated_test_confirmed=true"]
            for variable, role in [("client_user_id", "client"), ("engineer_user_id", "engineer"), ("rival_user_id", "rival"), ("admin_user_id", "admin")]:
                command += ["-v", variable + "=" + IDS[role]]
            result = subprocess.run(command, input=file.read_text(encoding="utf-8"), capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
            check(result.returncode == 0, "SQL assertions failed: " + result.stderr[-600:])
        record("SQL security", name, execute)


def cleanup_project(project, title):
    with connect() as connection:
        conversations = connection.execute("SELECT id FROM public.conversations WHERE project_id=%s", (project,)).fetchall()
        links = ["/client/projects/" + project + "/applications"]
        for (conversation,) in conversations:
            links += ["/client/messages/" + str(conversation), "/engineer/messages/" + str(conversation)]
        connection.execute("DELETE FROM public.notifications WHERE data->>'link'=ANY(%s) OR body LIKE %s", (links, '%"' + title + '"%'))
        connection.execute("DELETE FROM public.projects WHERE id=%s", (project,))


def cleanup():
    failed = []
    for project, title in list(PROJECTS):
        if record("Fixture cleanup", project, lambda: cleanup_project(project, title)):
            PROJECTS.remove((project, title))
        else:
            failed.append(project)
    check(not failed, "Fixture cleanup failed; retry these isolated project IDs: " + ", ".join(failed))


def local_env():
    return {**os.environ, "NEXT_PUBLIC_SUPABASE_URL": CONFIG["API_URL"],
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": CONFIG["PUBLISHABLE_KEY"], "NEXT_TELEMETRY_DISABLED": "1"}


def final_commands():
    for category, command in [
        ("Node automated", ["node", "--test", "tests/*.test.cjs"]),
        ("TypeScript", [str(ROOT / "node_modules/.bin/tsc.cmd"), "--noEmit"]),
        # The standalone smoke command first performs a fresh, verified local build.
        ("HTTP smoke", ["node", "scripts/atomic-http-smoke.cjs"]),
    ]:
        def execute(category=category, command=command):
            result = subprocess.run(command, cwd=ROOT, env=local_env(), capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
            check(result.returncode == 0, "Command failed: " + (result.stdout + result.stderr)[-650:])
            count = 1
            if category == "Node automated":
                summary = re.search(r"\bpass (\d+)", result.stdout + result.stderr)
                check(summary is not None, "Node pass summary not found")
                count = int(summary[1])
            elif category == "HTTP smoke":
                count = int(re.search(r"HTTP smoke: (\d+) passed", result.stdout)[1])
                check("Verified local production build completed" in result.stdout, "Fresh local build was not verified")
                RESULTS["Next.js build"] = {"passed": 1, "failed": 0, "skipped": 0}
            RESULTS[category]["passed"] = count - 1
        check(record(category, " ".join(command), execute), "Consolidated validation failed")


def navigate(page, url):
    return page.goto(url, wait_until="domcontentloaded")


def local_page(browser):
    page = browser.new_page()
    page.set_default_timeout(15000)
    page.set_default_navigation_timeout(45000)
    # Intercept external assets only. Intercepting local requests would stall
    # effect-driven Server Actions while the synchronous test polls PostgreSQL.
    page.route(re.compile(r"^https?://(?!(?:127\.0\.0\.1|localhost)(?::[0-9]+)?/).*"), lambda route: route.abort())
    return page


def close_browser(browser):
    failures = []
    try:
        for context in list(browser.contexts):
            try:
                context.close()
            except Exception:
                failures.append("context")
    finally:
        try:
            browser.close()
        except Exception:
            failures.append("browser")
    check(not failures, "Browser cleanup failed for: " + ", ".join(failures))


def browser_tests():
    from playwright.sync_api import sync_playwright, expect
    expect.set_options(timeout=15000)
    final_commands()
    password = authenticate()
    origin = "http://127.0.0.1:3018"
    server = subprocess.Popen(["node", "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3018"],
                              cwd=ROOT, env=local_env(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace",
                              creationflags=subprocess.CREATE_NO_WINDOW)
    ready = threading.Event()
    server_lines = []
    def output():
        for line in server.stdout:
            server_lines.append(line)
            del server_lines[:-40]
            if "Ready in" in line:
                ready.set()
    threading.Thread(target=output, daemon=True).start()
    extra_user = None
    try:
        check(ready.wait(25) and server.poll() is None, "Owned local application server did not start")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="msedge", headless=True)
            try:
                pages = {}
                for role in ["client", "engineer", "admin", "rival"]:
                    page = local_page(browser)
                    page.on("dialog", lambda dialog: dialog.accept())
                    pages[role] = page
                    def login(page=page, role=role):
                        navigate(page, origin + "/login")
                        page.locator("#email").fill(EMAILS[role])
                        page.locator("#password").fill(password)
                        page.get_by_role("button", name=re.compile(r"Log In|Sign In", re.I)).click()
                        workspace = "engineer" if role == "rival" else role
                        expect(page).to_have_url(re.compile("/" + workspace + "/dashboard$"))
                    check(record("Authentication E2E", role + " login", login), "Fixture browser login failed")
                for role, denied in [("engineer", "client"), ("client", "engineer"), ("client", "admin"), ("engineer", "admin")]:
                    def role_check(role=role, denied=denied):
                        page = pages[role]
                        navigate(page, origin + "/" + denied + "/dashboard")
                        expect(page).to_have_url(re.compile("/" + role + "/dashboard$"))
                    record("Role authorization E2E", role + " denied " + denied, role_check)

                client = pages["client"]
                engineer = pages["engineer"]
                project, applications, title = fixture(two=False)
                review_url = origin + "/client/projects/" + project + "/applications"
                conversation = None

                def start_conversation():
                    nonlocal conversation
                    navigate(client, review_url)
                    client.get_by_role("button", name="Send Message", exact=True).click()
                    expect(client).to_have_url(re.compile(r"/client/messages/[0-9a-f-]{36}$"))
                    conversation = client.url.rsplit("/", 1)[1]
                    navigate(client, review_url)
                    client.get_by_role("button", name="Send Message", exact=True).click()
                    expect(client).to_have_url(origin + "/client/messages/" + conversation)
                    check(sql("SELECT count(*) FROM public.conversations WHERE project_id=%s", (project,))[0][0] == 1, "Repeated conversation start duplicated rows")
                check(record("Messaging E2E", "eligible private conversation creation and repeat", start_conversation), "Conversation prerequisite failed")
                message = "Immediate client message " + str(uuid.uuid4())
                reply = "Immediate engineer reply " + str(uuid.uuid4())

                def send(page, text):
                    page.locator("textarea").fill(text)
                    page.get_by_role("button", name="Send", exact=True).click()
                    # No reload: this assertion reproduces the original bug.
                    expect(page.get_by_text(text, exact=True)).to_be_visible()
                    expect(page.get_by_text(text, exact=True)).to_have_count(1)
                    expect(page.locator("textarea")).to_have_value("")
                    check(sql("SELECT count(*) FROM public.messages WHERE conversation_id=%s AND body=%s", (conversation, text))[0][0] == 1, "Message missing or duplicated in PostgreSQL")
                record("Messaging E2E", "client message appears immediately without reload", lambda: send(client, message))

                def receipt_and_reply():
                    navigate(engineer, origin + "/engineer/messages/" + conversation)
                    expect(engineer.get_by_text(message, exact=True)).to_be_visible()
                    deadline = time.monotonic() + 10
                    while sql("SELECT read_at IS NOT NULL FROM public.messages WHERE conversation_id=%s AND body=%s", (conversation, message))[0][0] is not True:
                        check(time.monotonic() < deadline, "Incoming message did not become read")
                        threading.Event().wait(0.05)
                    send(engineer, reply)
                    expect(engineer.get_by_text(message, exact=True)).to_be_visible()
                record("Messaging E2E", "engineer receipt, read_at and immediate reply", receipt_and_reply)

                def read_status():
                    client.reload(wait_until="domcontentloaded")
                    expect(client.get_by_text(reply, exact=True)).to_be_visible()
                    expect(client.get_by_text("Read", exact=True)).to_be_visible()
                    deadline = time.monotonic() + 10
                    while sql("SELECT read_at IS NOT NULL FROM public.messages WHERE conversation_id=%s AND body=%s", (conversation, reply))[0][0] is not True:
                        check(time.monotonic() < deadline, "Reply read receipt missing")
                        threading.Event().wait(0.05)
                    engineer.reload(wait_until="domcontentloaded")
                    expect(engineer.get_by_text("Read", exact=True)).to_be_visible()
                    expect(engineer.get_by_text(message, exact=True)).to_have_count(1)
                    expect(engineer.get_by_text(reply, exact=True)).to_have_count(1)
                record("Messaging E2E", "bidirectional read receipts and existing history", read_status)

                def message_security():
                    for role in ["rival", None]:
                        code, data = http("/rest/v1/messages?conversation_id=eq." + conversation, role=role)
                        check((code == 200 and data == []) or code in [401, 403], "Unauthorized message history exposed")
                        code, _ = http("/rest/v1/messages", "POST", {"conversation_id": conversation, "sender_profile_id": IDS.get(role, IDS["engineer"]), "body": "Unauthorized fixture message"}, role=role)
                        check(code in [401, 403], "Unauthorized message send succeeded")
                    code, _ = http("/rest/v1/messages", "POST", {"conversation_id": conversation, "sender_profile_id": IDS["client"], "body": "Spoofed sender"}, role="engineer")
                    check(code in [401, 403], "Message sender was spoofed")
                    for body in ["", " "]:
                        code, _ = http("/rest/v1/messages", "POST", {"conversation_id": conversation, "sender_profile_id": IDS["engineer"], "body": body}, role="engineer")
                        check(code == 400, "Blank message accepted")
                    for route in [conversation, "invalid-id"]:
                        response = navigate(pages["rival"], origin + "/engineer/messages/" + route)
                        check(response.status == 404, "Unowned or invalid thread did not return 404")
                    guest = local_page(browser)
                    navigate(guest, origin + "/client/messages/" + conversation)
                    expect(guest).to_have_url(re.compile("/login\\?"))
                    guest.close()
                record("Messaging security", "rival/guest denial, invalid IDs, blanks and sender spoofing", message_security)

                def unrelated_client():
                    nonlocal extra_user
                    email = "civilhub-unrelated-" + str(uuid.uuid4()) + "@example.invalid"
                    code, account = http("/auth/v1/admin/users", "POST", {
                        "email": email, "password": password, "email_confirm": True,
                        "user_metadata": {"role": "client", "full_name": "Unrelated disposable client"},
                    }, admin=True)
                    check(code == 200, "Cannot create disposable unrelated client")
                    extra_user = account["id"]
                    code, session = http("/auth/v1/token?grant_type=password", "POST", {"email": email, "password": password})
                    check(code == 200, "Cannot authenticate unrelated disposable client")
                    TOKENS["other"] = session["access_token"]
                    SECRETS.append(session["access_token"])
                    code, rows = http("/rest/v1/conversations?id=eq." + conversation, role="other")
                    check(code == 200 and rows == [], "Unrelated client can read the conversation")
                    code, rows = http("/rest/v1/messages?conversation_id=eq." + conversation, role="other")
                    check(code == 200 and rows == [], "Unrelated client can read message history")
                    code, rows = http("/rest/v1/project_applications?id=eq." + applications[0], "PATCH", {"status": "rejected"}, role="other")
                    check(code == 200 and rows == [], "Unrelated client can reject an application")
                    code, data = http("/rest/v1/rpc/accept_project_application", "POST", {
                        "target_project_id": project, "target_application_id": applications[0],
                    }, role="other")
                    check(code == 400 and data.get("code") == "PA002", "Unrelated client can accept another owner's application")
                    page = local_page(browser)
                    navigate(page, origin + "/login")
                    page.locator("#email").fill(email)
                    page.locator("#password").fill(password)
                    page.get_by_role("button", name=re.compile(r"Log In|Sign In", re.I)).click()
                    expect(page).to_have_url(re.compile("/client/dashboard$"))
                    response = navigate(page, origin + "/client/messages/" + conversation)
                    check(response.status == 404, "Unrelated client can open the private thread")
                    page.close()
                record("Messaging security", "unrelated client denied by browser and RLS", unrelated_client)

                def notifications():
                    rows = sql("SELECT profile_id,type FROM public.notifications WHERE data->>'link'=ANY(%s)",
                               (["/client/messages/" + conversation, "/engineer/messages/" + conversation, "/client/projects/" + project + "/applications"],))
                    check(sum(row[1] == "new_message" for row in rows) == 2, "Message notifications missing or duplicated")
                    check(sum(row[1] == "project_application" for row in rows) == 1, "Application notification missing or duplicated")
                    navigate(client, origin + "/client/notifications")
                    expect(client.get_by_text(title, exact=False).first).to_be_visible()
                record("Messaging E2E", "existing application/message notifications and notification UI", notifications)

                def accept_ui():
                    navigate(client, review_url)
                    client.get_by_role("button", name="Accept Engineer", exact=True).click()
                    expect(client.get_by_text("Selected Engineer", exact=False)).to_be_visible()
                    rows = state(project)
                    check(rows[0][2] == "accepted", "Browser acceptance did not persist")
                    navigate(engineer, origin + "/projects/" + project)
                    expect(engineer.get_by_text("Application Accepted!", exact=False)).to_be_visible()
                    expect(engineer.get_by_role("button", name="Withdraw Application")).to_have_count(0)
                    navigate(engineer, origin + "/engineer/projects")
                    expect(engineer.locator('section[aria-labelledby="assigned-projects-heading"]').get_by_text(title, exact=True)).to_be_visible()
                    code, data = http("/rest/v1/project_applications?id=eq." + applications[0], "PATCH", {"status": "withdrawn"}, role="engineer")
                    check((code == 200 and data == []) or code in [400, 403], "Accepted application was withdrawn")
                    state(project)
                record("Project/application E2E", "acceptance, assignment UI and accepted-withdrawal denial", accept_ui)

                def reject_ui():
                    rejected_project, apps, _ = fixture(two=False)
                    navigate(client, origin + "/client/projects/" + rejected_project + "/applications")
                    code, data = http("/rest/v1/project_applications?id=eq." + apps[0] + "&status=eq.pending", "PATCH", {"status": "rejected"}, role="rival")
                    check((code == 200 and data == []) or code == 403, "Rival rejected another engineer")
                    client.get_by_role("button", name="Reject", exact=True).click()
                    expect(client.get_by_text("Rejected", exact=True).first).to_be_visible()
                    check(state(rejected_project)[0][2] == "rejected", "Rejection not persisted")
                    code, data = http("/rest/v1/project_applications?id=eq." + apps[0] + "&status=eq.pending", "PATCH", {"status": "rejected"}, role="client")
                    check(code == 200 and data == [], "Repeated rejection modified a finalized row")
                record("Project/application E2E", "rejection lifecycle, ownership and repeated rejection", reject_ui)

                def withdraw_ui():
                    withdrawn_project, apps, _ = fixture(two=False)
                    for role in ["rival", "client"]:
                        code, data = http("/rest/v1/project_applications?id=eq." + apps[0] + "&status=eq.pending", "PATCH", {"status": "withdrawn"}, role=role)
                        check((code == 200 and data == []) or code == 403, "Nonowner withdrew application")
                    navigate(engineer, origin + "/projects/" + withdrawn_project)
                    engineer.get_by_role("button", name="Withdraw Application", exact=True).click()
                    expect(engineer.get_by_text("You withdrew your application", exact=False)).to_be_visible()
                    check(state(withdrawn_project)[0][2] == "withdrawn", "Withdrawal not persisted")
                record("Project/application E2E", "withdrawal lifecycle and client/rival denial", withdraw_ui)
            finally:
                record("Browser cleanup", "contexts and browser", lambda: close_browser(browser))
    finally:
        for line in server_lines:
            if "error" in line.lower() or "warn" in line.lower():
                for secret in SECRETS:
                    if secret:
                        line = line.replace(secret, "[redacted]")
                print("Local server: " + line.strip(), flush=True)
        try:
            if extra_user:
                code, _ = http("/auth/v1/admin/users/" + extra_user, "DELETE", admin=True)
                check(code in [200, 204], "Could not clean up unrelated disposable client")
        finally:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=10)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["database", "concurrency", "browser", "all"], default="all")
    options = parser.parse_args()
    configure()
    try:
        if options.phase in ["database", "all"]:
            database_tests()
        if options.phase in ["database", "concurrency", "all"]:
            concurrency()
        if options.phase in ["browser", "all"]:
            browser_tests()
    finally:
        record("Database", "scoped disposable fixture cleanup", cleanup)
        destination = ROOT / (".next/local-release-" + options.phase + "-results.json")
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(RESULTS, indent=2), encoding="utf-8")
        print(json.dumps(RESULTS, indent=2), flush=True)
    check(not any(counts["failed"] for counts in RESULTS.values()), "Release checks failed")


if __name__ == "__main__":
    main()
