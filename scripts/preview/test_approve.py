import unittest
from unittest.mock import patch
import approve

SHA = 'a' * 40
OLD, NEW = 'dpl_old', 'dpl_new'


def deployment(**changes):
    return dict(readyState='READY', target=None, projectId=approve.PROJECT,
                url='preview-test.vercel.app', meta=dict(githubCommitSha=SHA,
                githubOrg='ThiagoCardim', githubRepo='plataforma-RH'), **changes)


class ApprovalTests(unittest.TestCase):
    def test_valid_preview(self):
        approve.validate(deployment(), SHA)

    def test_reject_mismatched_identity_state_and_production(self):
        for key, value in [('readyState', 'BUILDING'), ('target', 'production'),
                           ('projectId', 'another-project'), ('url', 'evil.example')]:
            d = deployment()
            d[key] = value
            with self.subTest(key=key), self.assertRaises(RuntimeError):
                approve.validate(d, SHA)
        with self.assertRaises(RuntimeError):
            approve.validate(deployment(), 'b' * 40)

    def test_reject_invalid_input_without_api(self):
        with patch.object(approve, 'api') as api:
            with self.assertRaises(RuntimeError):
                approve.move('token', 'not-a-deployment', SHA)
            api.assert_not_called()

    def run_move(self, fail_probe=False, not_ready=False):
        destination = [OLD]
        writes = []

        def api(path, token, body=None):
            if path.startswith('/v9/projects/'):
                return {'ssoProtection': {'deploymentType': 'all_except_custom_domains'}}
            if path.startswith('/v13/'):
                d = deployment()
                if not_ready:
                    d['readyState'] = 'BUILDING'
                return d
            if body:
                destination[0] = path.split('/')[3]
                writes.append(destination[0])
                return {}
            return {'projectId': approve.PROJECT, 'deploymentId': destination[0]}

        count = [0]
        def protected(host):
            count[0] += 1
            if fail_probe and count[0] == 3:
                raise RuntimeError('unprotected')

        with patch.object(approve, 'api', side_effect=api), patch.object(approve, 'protected', side_effect=protected):
            if fail_probe or not_ready:
                with self.assertRaises(RuntimeError):
                    approve.move('fake', NEW, SHA)
            else:
                approve.move('fake', NEW, SHA)
        return destination[0], writes

    def test_success(self):
        self.assertEqual(self.run_move(), (NEW, [NEW]))

    def test_failure_restores_previous(self):
        self.assertEqual(self.run_move(fail_probe=True), (OLD, [NEW, OLD]))

    def test_not_ready_never_writes(self):
        self.assertEqual(self.run_move(not_ready=True), (OLD, []))


if __name__ == '__main__':
    unittest.main()
