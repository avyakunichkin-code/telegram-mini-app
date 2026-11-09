"""Anonymous session capability is stored only as a hash on the server."""
import hashlib
import secrets
import threading
import time
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from ..auth import create_access_token, get_password_hash
from ..models import GuestSession, User
from ..schemas import Token
from ..timeutil import utc_now_naive

COOKIE = "tvoy_hod_guest"
MAX_AGE = 60 * 60 * 24 * 180
_creation_windows = {}
_creation_lock = threading.Lock()


def check_creation_rate(host):
    """Bounded per-process abuse guard; reverse-proxy limits still apply in deployment."""
    now = time.monotonic()
    with _creation_lock:
        for key in list(_creation_windows):
            if now - _creation_windows[key][0] >= 60:
                del _creation_windows[key]
        started, count = _creation_windows.get(host, (now, 0))
        if count >= 20 or (host not in _creation_windows and len(_creation_windows) >= 10000):
            raise HTTPException(429, "Попробуй начать игру через минуту", headers={"Retry-After": "60"})
        _creation_windows[host] = (started, count + 1)


def session_for(db, capability):
    if not capability or len(capability) > 128:
        return None
    digest = hashlib.sha256(capability.encode()).hexdigest()
    return db.query(GuestSession).filter(
        GuestSession.token_hash == digest,
        GuestSession.expires_at > utc_now_naive(),
    ).first()


def token_for(user):
    return Token(access_token=create_access_token({"sub": str(user.id), "guest": bool(user.is_guest)}),
                 token_type="bearer", user_id=user.id, username=user.username,
                 is_guest=bool(user.is_guest))


def resume_or_create(db, capability):
    session = session_for(db, capability)
    if session:
        user = db.get(User, session.user_id)
        if user and user.is_guest:
            return user, capability
    capability = secrets.token_urlsafe(32)
    user = User(username="guest_" + secrets.token_hex(16), hashed_password="", is_guest=1)
    db.add(user)
    db.flush()
    db.add(GuestSession(user_id=user.id,
                        token_hash=hashlib.sha256(capability.encode()).hexdigest(),
                        expires_at=utc_now_naive() + timedelta(seconds=MAX_AGE)))
    db.commit()
    return user, capability


def claim(db, user, capability, data):
    session = session_for(db, capability)
    if not user.is_guest or not session or session.user_id != user.id:
        raise HTTPException(403, "Guest session required")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(409, "Email already registered")
    # Conditional update prevents two claims of the same anonymous identity.
    password_hash = get_password_hash(data.password)
    try:
        changed = db.query(User).filter(User.id == user.id, User.is_guest == 1).update({
            User.email: data.email, User.hashed_password: password_hash, User.is_guest: 0,
        }, synchronize_session=False)
        if changed != 1:
            db.rollback()
            raise HTTPException(409, "Guest already claimed")
        db.query(GuestSession).filter(GuestSession.user_id == user.id).delete()
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    db.refresh(user)
    return token_for(user)
