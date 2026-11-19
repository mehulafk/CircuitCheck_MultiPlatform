import pytest
from backend.deployment import public_origin, origin_allowed


@pytest.mark.parametrize('value', ['http://review.example.com', 'https://user:pass@example.com',
    'https://example.com/path', 'https://*.example.com', 'https://example.com?x=1',
    'https://example.com#fragment', 'https://example.com:bad'])
def test_public_url_rejects_invalid_configuration(value):
    with pytest.raises(ValueError):
        public_origin(value)


def test_public_origin_normalization():
    assert public_origin('https://Review.Example.com:443/') == 'https://review.example.com'
    assert public_origin('https://example.com:8443') == 'https://example.com:8443'
    assert public_origin('') == ''


@pytest.mark.parametrize('origin', ['https://attacker.test', 'https://review.example.com.attacker.test',
    'http://review.example.com', 'https://review.example.com:8443', 'null',
    'https://review.example.com/path', 'http://localhost:5173'])
def test_server_rejects_other_origins(origin):
    assert not origin_allowed(origin, 'https://review.example.com')


def test_server_accepts_only_its_origin_or_non_browser_client():
    assert origin_allowed('https://review.example.com', 'https://review.example.com')
    assert origin_allowed('https://review.example.com:443', 'https://review.example.com')
    assert origin_allowed(None, 'https://review.example.com')


def test_local_development_still_works():
    assert origin_allowed('http://localhost:5173', '')
    assert origin_allowed('http://127.0.0.1:8000', '')
    assert origin_allowed('http://[::1]:8000', '')
    assert not origin_allowed('https://attacker.test', '')
    assert not origin_allowed('null', '')


def test_public_api_mutation_boundary(client, monkeypatch):
    import backend.main as main
    monkeypatch.setattr(main, 'PUBLIC_ORIGIN', 'https://review.example.com')
    # This route has no side effects; passing the boundary reaches its normal 404.
    path = '/api/projects/missing/analyze'
    assert client.post(path, headers={'Origin': 'https://review.example.com'}).status_code == 404
    assert client.post(path, headers={'Origin': 'https://attacker.test'}).status_code == 403
    assert client.post(path, headers={'Origin': 'https://review.example.com', 'X-CircuitCheck': '0'}).status_code == 403
