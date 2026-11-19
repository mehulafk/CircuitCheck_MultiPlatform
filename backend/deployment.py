"""Explicit public origin for the authenticated reverse-proxy deployment."""
from urllib.parse import urlsplit


def public_origin(value: str) -> str:
    if not value:
        return ''
    url = urlsplit(value)
    if (url.scheme != 'https' or not url.hostname or url.username or url.password
            or url.path not in ('', '/') or url.query or url.fragment
            or '*' in url.netloc):
        raise ValueError('CIRCUITCHECK_PUBLIC_URL must be an HTTPS origin, e.g. https://review.example.com')
    # Accessing port also rejects malformed values before serving requests.
    port = url.port
    host = f'[{url.hostname}]' if ':' in url.hostname else url.hostname
    return f'https://{host}' + (f':{port}' if port and port != 443 else '')


def origin_allowed(origin: str | None, configured: str) -> bool:
    if origin is None:
        return True  # CLI clients still need X-CircuitCheck and proxy authentication.
    try:
        url = urlsplit(origin)
        if (url.username or url.password or url.path or url.query or url.fragment
                or url.scheme not in ('http', 'https')):
            return False
        if configured:
            return public_origin(origin) == configured
        return url.hostname in ('localhost', '127.0.0.1', '::1') and url.port != 0
    except ValueError:
        return False
