"""Safety regressions using stubs only: no database, HTTP or browser operations."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("release_runner", Path(__file__).with_name("local_release_validation.py"))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
DSN = "postgresql://postgres:unit-only@127.0.0.1:54322/postgres"


class LocalityTests(unittest.TestCase):
    def test_explicit_single_loopback_destination(self):
        parameters = runner.connection_parameters(DSN, {})
        self.assertEqual((parameters["host"], parameters["hostaddr"], parameters["port"], parameters["dbname"]),
                         ("127.0.0.1", "127.0.0.1", 54322, "postgres"))

    def test_query_and_routing_overrides_never_reach_connect(self):
        uris = [DSN + "?" + key + "=example.invalid" for key in
                ["host", "hostaddr", "port", "service", "servicefile", "dbname", "options", "target_session_attrs", "load_balance_hosts", "%68ost"]]
        uris += ["postgresql:///postgres?host=/tmp", "postgresql://%2Ftmp:54322/postgres",
                 "postgresql://postgres:unit-only@127.0.0.1:54322,example.invalid:54322/postgres",
                 "postgresql://postgres:unit-only@example.invalid:54322/postgres",
                 "postgresql://postgres:unit-only@[::1]:54322/postgres",
                 "postgresql://postgres:unit-only@localhost:54322/postgres", DSN + "#routing",
                 "host=127.0.0.1 port=54322 dbname=postgres service=external"]
        with patch.dict(os.environ, {}, clear=True), patch.object(runner.psycopg, "connect") as connect:
            for uri in uris:
                with self.subTest(uri_kind=uris.index(uri)), patch.dict(runner.CONFIG, {"DB_URL": uri}, clear=True):
                    with self.assertRaisesRegex(ValueError, "Refusing unexpected") as error:
                        runner.connect()
                    self.assertNotIn("unit-only", str(error.exception))
            connect.assert_not_called()

    def test_libpq_environment_is_rejected_before_connect(self):
        for key in ["PGHOST", "pghost", "PGHOSTADDR", "PGPORT", "PGSERVICE", "PGSERVICEFILE", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGPASSFILE", "PGOPTIONS"]:
            with self.subTest(variable=key), patch.dict(os.environ, {key: "unexpected"}, clear=True), \
                    patch.dict(runner.CONFIG, {"DB_URL": DSN}, clear=True), patch.object(runner.psycopg, "connect") as connect:
                with self.assertRaises(ValueError):
                    runner.connect()
                connect.assert_not_called()

    def test_connect_uses_explicit_parameters_and_closes_failed_setup(self):
        connection = MagicMock()
        connection.execute.side_effect = RuntimeError("setup failure")
        with patch.dict(os.environ, {}, clear=True), patch.dict(runner.CONFIG, {"DB_URL": DSN}, clear=True), \
                patch.object(runner.psycopg, "connect", return_value=connection) as connect:
            with self.assertRaises(RuntimeError):
                runner.connect()
            self.assertEqual(connect.call_args.kwargs["hostaddr"], "127.0.0.1")
            self.assertEqual(connect.call_args.kwargs["port"], 54322)
            self.assertEqual(connect.call_args.args, ())
            connection.close.assert_called_once()

    def test_container_discovery_has_a_timeout(self):
        config = {"DB_URL": DSN, "API_URL": "http://127.0.0.1:54321"}
        command_result = MagicMock(stdout=runner.json.dumps(config))
        with patch.dict(os.environ, {}, clear=True), patch.object(runner.subprocess, "run", return_value=command_result), \
                patch.object(runner.subprocess, "check_output", return_value="supabase_db_civilhub-atomic-db-test\nsupabase_auth_civilhub-atomic-db-test") as docker, \
                patch.object(runner, "verify_container_port") as mapping:
            runner.configure()
            self.assertEqual(docker.call_args.kwargs["timeout"], 15)
            self.assertEqual(mapping.call_count, 2)


class DispatchTests(unittest.TestCase):
    def test_all_ten_dispatched_labels_select_the_intended_operations(self):
        expected = {
            "rival accept": (["accept", "accept"], ("error", "PA003")),
            "same application": (["accept", "accept"], ("ok", "accepted")),
            "accept then reject": (["accept", "rejected"], ("ok", 0)),
            "reject then accept": (["rejected", "accept"], ("error", "PA003")),
            "accept then withdraw": (["accept", "withdrawn"], ("ok", 0)),
            "withdraw then accept": (["withdrawn", "accept"], ("error", "PA003")),
            "completed then accept": (["completed", "accept"], ("error", "PA005")),
            "on_hold then accept": (["on_hold", "accept"], ("error", "PA005")),
            "accept then completed": (["accept", "completed"], ("ok", 1)),
            "unpublish then accept": (["unpublish", "accept"], ("ok", "accepted")),
        }
        for label, (operations, result) in expected.items():
            with self.subTest(label=label):
                seen = []
                connection = MagicMock()
                def execute(query, args=()):
                    seen.append("unpublish" if "is_published=false" in query else
                                "completed" if "status='completed'" in query else args[0])
                    return MagicMock(rowcount=1)
                connection.execute.side_effect = execute
                def race(first, second, *args, **kwargs):
                    first[1](connection)
                    second(connection)
                    return result
                winners = 0 if result[0] == "error" and label != "rival accept" else 1
                project_status = "completed" if "completed" in label else "planned"
                rows = [(1 if winners else None, 1, "accepted" if winners else "pending", project_status)]
                with patch.object(runner, "fixture", return_value=("project", ["a", "b"], "title")), \
                        patch.object(runner, "race", side_effect=race), \
                        patch.object(runner, "accept", side_effect=lambda *args: seen.append("accept")), \
                        patch.object(runner, "decision", side_effect=lambda c, a, status: seen.append(status) or 0), \
                        patch.object(runner, "state", return_value=rows), patch.object(runner, "sql", return_value=[(winners,)]), \
                        patch.object(runner, "record", side_effect=lambda category, name, operation: operation() if name == label else None):
                    runner.concurrency()
                self.assertEqual(seen, operations)


class CleanupTests(unittest.TestCase):
    def test_fixture_cleanup_continues_and_reports_failed_id(self):
        projects = [("first-fixture", "one"), ("second-fixture", "two")]
        with patch.object(runner, "PROJECTS", projects.copy()), patch.dict(runner.RESULTS, {}, clear=True), \
                patch.object(runner, "cleanup_project", side_effect=[RuntimeError("failure"), None]) as cleanup, \
                contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(AssertionError, "first-fixture"):
                runner.cleanup()
            self.assertEqual(cleanup.call_count, 2)
            self.assertEqual(runner.PROJECTS, [projects[0]])

    def test_browser_and_remaining_contexts_close_after_context_failure(self):
        first, second, browser = MagicMock(), MagicMock(), MagicMock()
        first.close.side_effect = RuntimeError("failure")
        browser.contexts = [first, second]
        with self.assertRaisesRegex(AssertionError, "context"):
            runner.close_browser(browser)
        first.close.assert_called_once()
        second.close.assert_called_once()
        browser.close.assert_called_once()

    def test_unsafe_reuse_flag_is_rejected_before_configuration(self):
        with patch.object(sys, "argv", ["runner", "--skip-commands"]), patch.object(runner, "configure") as configure, \
                contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                runner.main()
            self.assertEqual(error.exception.code, 2)
            configure.assert_not_called()


if __name__ == "__main__":
    unittest.main()
