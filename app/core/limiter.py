from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance, imported by main.py (for setup) and any route
# file that needs to apply rate limits to specific endpoints.
limiter = Limiter(key_func=get_remote_address)
