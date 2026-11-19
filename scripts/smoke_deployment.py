"""Exercise a disposable CI deployment through its actual API and worker."""
import json
import time
import urllib.request

BASE = 'http://127.0.0.1:8000'


def request(path, method='GET'):
    req = urllib.request.Request(BASE + path, method=method, headers={'X-CircuitCheck': '1'})
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)


def main():
    health = request('/api/health')
    assert health['engine_available'], health
    with urllib.request.urlopen(BASE, timeout=10) as response:
        assert b'/assets/' in response.read(), 'Production frontend is missing'
    with urllib.request.urlopen(BASE + '/downloads/Circuit-Check-Multi-platform-v0.6.2.zip') as response:
        assert response.read(4) == b'PK\x03\x04', 'Original extension download is missing'
    project = request('/api/sample', 'POST')
    deadline = time.monotonic() + 240
    while time.monotonic() < deadline:
        job = request('/api/jobs/' + project['job_id'])
        if job['status'] not in ('queued', 'running'):
            assert job['status'] == 'completed', job
            result = request('/api/projects/' + project['project_id'])['revision']['result']
            assert result and result['engine_version'] == '10.0.7', result
            print('Full application passed: frontend, extension download, API, shared storage and native KiCad worker.')
            return
        time.sleep(2)
    raise RuntimeError('Worker did not finish the sample project within 240 seconds')


if __name__ == '__main__':
    main()
