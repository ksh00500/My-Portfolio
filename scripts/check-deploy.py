#!/usr/bin/env python3
"""Linux regression tests: real temporary Git remotes, fake Docker/curl, no live DB."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('deploy-portfolio.sh').resolve()
MOCK = r'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
path = Path(os.environ['MOCK_STATE'])
state = json.loads(path.read_text())
args = sys.argv[1:]
name = Path(sys.argv[0]).name
with open(os.environ['MOCK_LOG'], 'a') as f:
    f.write(json.dumps([name] + args) + '\n')
if name == 'curl':
    assert '--max-time' in args and '--connect-timeout' in args
    if state.get('probe_fail') and args[-1].endswith('/portfolio'):
        sys.exit(22)
    if state.get('swap_during_probe') and args[-1].endswith('/portfolio'):
        state['container'] = 'f' * 64
        path.write_text(json.dumps(state))
    sys.exit(0)
if args[:3] == ['compose', '-p', 'portfolio-test']:
    command = args[3:]
    if command == ['build', 'web']:
        if state.get('build_fail'): sys.exit(1)
        state['builds'] += 1
        state['built_image'] = 'sha256:' + format(state['builds'], '064x')
        path.write_text(json.dumps(state))
    elif command[:1] == ['up']:
        assert command == ['up', '-d', '--no-deps', '--no-build', '--force-recreate', 'web']
        if state.get('up_fail'): sys.exit(1)
        state['image'] = state['built_image']
        state['container'] = format(state['builds'] + 100, '064x')
        state['health'] = state.get('next_health', 'healthy')
        state['status'] = 'running'
        path.write_text(json.dumps(state))
    elif command == ['ps', '-a', '-q', 'web']:
        if state.get('container'): print(state['container'])
    else:
        raise AssertionError('Unexpected Compose command: ' + repr(command))
elif args[:2] == ['inspect', '--format']:
    if not state.get('container'): sys.exit(1)
    print(state['container'], state['image'], state['status'], state['health'])
else:
    raise AssertionError('Unexpected Docker command: ' + repr(args))
'''


class DeployTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='portfolio-deploy-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.remote = self.root / 'remote.git'
        self.publisher = self.root / 'publisher'
        self.checkout = self.root / 'checkout'
        self.state_file = self.root / 'state' / 'portfolio-test.json'
        self.pending_file = self.root / 'state' / 'portfolio-test.pending'
        self.fake_state = self.root / 'docker.json'
        self.log = self.root / 'commands.jsonl'
        self.fake_state.write_text(json.dumps(dict(builds=0)))
        bin_dir = self.root / 'bin'
        bin_dir.mkdir()
        for tool in ('docker', 'curl'):
            file = bin_dir / tool
            file.write_text(MOCK)
            file.chmod(0o755)
        self.env = dict(os.environ, PATH=str(bin_dir) + os.pathsep + os.environ['PATH'],
                        HOME=str(self.root), GIT_CONFIG_NOSYSTEM='1',
                        PROJECT_DIR=str(self.checkout), BRANCH='deploy-test',
                        COMPOSE_PROJECT='portfolio-test', STATE_DIR=str(self.state_file.parent),
                        LOCK_FILE=str(self.root / 'deploy.lock'), HEALTH_ATTEMPTS='2',
                        HEALTH_INTERVAL='0', MOCK_STATE=str(self.fake_state), MOCK_LOG=str(self.log),
                        HEALTH_URL='http://fake/api/health', PORTFOLIO_URL='http://fake/api/portfolio')
        self.git(self.root, 'init', '--bare', str(self.remote))
        self.git(self.root, 'init', '-b', 'deploy-test', str(self.publisher))
        self.configure(self.publisher)
        self.git(self.publisher, 'remote', 'add', 'origin', str(self.remote))
        self.publish()
        self.git(self.root, 'clone', '-b', 'deploy-test', str(self.remote), str(self.checkout))
        self.configure(self.checkout)

    def git(self, cwd, *args):
        return subprocess.run(['git', *args], cwd=cwd, env=self.env, check=True,
                              capture_output=True, text=True).stdout.strip()

    def configure(self, repo):
        self.git(repo, 'config', 'user.email', 'test@example.invalid')
        self.git(repo, 'config', 'user.name', 'Deployment test')

    def publish(self):
        file = self.publisher / 'source.txt'
        file.write_text(file.read_text() + '\nchange' if file.exists() else 'initial')
        self.git(self.publisher, 'add', 'source.txt')
        self.git(self.publisher, 'commit', '-m', 'test change')
        self.git(self.publisher, 'push', 'origin', 'deploy-test')
        return self.git(self.publisher, 'rev-parse', 'HEAD')

    def fake(self, **updates):
        state = json.loads(self.fake_state.read_text())
        state.update(updates)
        self.fake_state.write_text(json.dumps(state))
        return state

    def run_deploy(self, *args, ok=True, force='0'):
        result = subprocess.run(['bash', str(SCRIPT), *args], env=dict(self.env, FORCE=force),
                                text=True, capture_output=True, timeout=25)
        if ok:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def record(self):
        return json.loads(self.state_file.read_text())

    def assert_builds(self, count):
        self.assertEqual(self.fake()['builds'], count)

    def test_first_equal_sha_deploys_then_only_verified_success_skips(self):
        self.run_deploy()
        self.assertEqual(self.record()['commit'], self.git(self.checkout, 'rev-parse', 'HEAD'))
        self.assertFalse(self.pending_file.exists())
        self.run_deploy()
        self.assert_builds(1)

    def test_manual_pull_still_deploys_new_commit(self):
        self.run_deploy()
        target = self.publish()
        self.git(self.checkout, 'pull', '--ff-only', 'origin', 'deploy-test')
        self.run_deploy()
        self.assertEqual(self.record()['commit'], target)
        self.assert_builds(2)

    def test_new_remote_fast_forwards_even_with_main_only_fetch_configuration(self):
        self.run_deploy()
        target = self.publish()
        self.git(self.checkout, 'config', '--replace-all', 'remote.origin.fetch',
                 '+refs/heads/main:refs/remotes/origin/main')
        self.run_deploy()
        self.assertEqual(self.record()['commit'], target)
        self.assert_builds(2)

    def test_build_failure_preserves_record_and_retries_equal_sha(self):
        self.run_deploy()
        previous = self.state_file.read_bytes()
        target = self.publish()
        self.fake(build_fail=True)
        self.run_deploy(ok=False)
        self.assertEqual(self.git(self.checkout, 'rev-parse', 'HEAD'), target)
        self.assertEqual(self.state_file.read_bytes(), previous)
        self.fake(build_fail=False)
        self.run_deploy()
        self.assertEqual(self.record()['commit'], target)

    def test_failed_force_same_sha_also_retries(self):
        self.run_deploy()
        previous = self.state_file.read_bytes()
        self.fake(build_fail=True)
        self.run_deploy(force='1', ok=False)
        self.assertEqual(self.state_file.read_bytes(), previous)
        self.assertTrue(self.pending_file.exists())
        self.fake(build_fail=False)
        self.run_deploy()
        self.assert_builds(2)

    def test_container_replacement_failure_preserves_success_and_retries(self):
        self.run_deploy()
        previous = self.state_file.read_bytes()
        self.fake(up_fail=True)
        self.run_deploy(force='1', ok=False)
        self.assertEqual(self.state_file.read_bytes(), previous)
        self.fake(up_fail=False)
        self.run_deploy()
        self.assert_builds(3)

    def test_unhealthy_container_does_not_advance_success_record(self):
        self.run_deploy()
        previous = self.state_file.read_bytes()
        self.fake(next_health='unhealthy')
        self.run_deploy(force='1', ok=False)
        self.assertEqual(self.state_file.read_bytes(), previous)
        self.fake(next_health='healthy')
        self.run_deploy()
        self.assert_builds(3)

    def test_portfolio_api_failure_is_not_success(self):
        self.run_deploy()
        previous = self.state_file.read_bytes()
        self.fake(probe_fail=True)
        self.run_deploy(ok=False)
        self.assertEqual(self.state_file.read_bytes(), previous)
        self.fake(probe_fail=False)
        self.run_deploy()
        self.assert_builds(3)

    def test_missing_container_redeploys_despite_success_record(self):
        self.run_deploy()
        self.fake(container='')
        self.run_deploy()
        self.assert_builds(2)

    def test_changed_image_redeploys(self):
        self.run_deploy()
        self.fake(image='sha256:' + 'e' * 64)
        self.run_deploy()
        self.assert_builds(2)

    def test_container_change_during_verification_is_rejected(self):
        self.fake(swap_during_probe=True)
        self.run_deploy(ok=False)
        self.assertFalse(self.state_file.exists())
        self.assertTrue(self.pending_file.exists())

    def test_corrupt_record_rebuilds(self):
        self.run_deploy()
        self.state_file.write_text('{invalid json')
        self.run_deploy()
        self.assert_builds(2)

    def test_check_only_does_not_change_checkout_or_record(self):
        old = self.git(self.checkout, 'rev-parse', 'HEAD')
        self.publish()
        self.run_deploy('--check')
        self.assertEqual(self.git(self.checkout, 'rev-parse', 'HEAD'), old)
        self.assertFalse(self.state_file.exists())
        self.assertFalse(self.pending_file.exists())
        self.assert_builds(0)

    def test_dirty_checkout_is_preserved(self):
        (self.checkout / 'source.txt').write_text('uncommitted')
        self.run_deploy(ok=False)
        self.assertEqual((self.checkout / 'source.txt').read_text(), 'uncommitted')
        self.assert_builds(0)

    def test_unpublished_local_commit_is_preserved(self):
        (self.checkout / 'source.txt').write_text('unpublished')
        self.git(self.checkout, 'commit', '-am', 'local only')
        local = self.git(self.checkout, 'rev-parse', 'HEAD')
        self.run_deploy(ok=False)
        self.assertEqual(self.git(self.checkout, 'rev-parse', 'HEAD'), local)
        self.assert_builds(0)

    def test_deployment_lock_skips_build(self):
        import fcntl
        with open(self.env['LOCK_FILE'], 'w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.run_deploy()
        self.assert_builds(0)


if __name__ == '__main__':
    if os.name != 'posix' or not shutil.which('bash') or not shutil.which('git'):
        raise SystemExit('Run these isolated tests on Linux with Bash, Git, flock and Python 3.')
    unittest.main(verbosity=2)
