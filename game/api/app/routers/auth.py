from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin, Token
from ..auth import get_password_hash, password_needs_rehash, verify_password, create_access_token, get_current_user
from ..auth_username import allocate_username_from_email

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/guest", response_model=Token)
def guest(request: Request, response: Response, resume_only: bool = False, db: Session = Depends(get_db)):
    from ..services.guest_auth import COOKIE, MAX_AGE, resume_or_create, token_for
    from ..services.guest_auth import session_for, check_creation_rate
    capability = request.cookies.get(COOKIE)
    if not session_for(db, capability):
        if resume_only:
            raise HTTPException(401, "Guest session expired")
        check_creation_rate(request.client.host if request.client else "unknown")
    user, capability = resume_or_create(db, request.cookies.get(COOKIE))
    local = request.url.hostname in {"localhost", "127.0.0.1", "testserver"}
    response.set_cookie(COOKIE, capability, max_age=MAX_AGE, httponly=True,
                        secure=not local, samesite="lax" if local else "none", path="/api/auth/guest")
    return token_for(user)


@router.post("/auth/guest/claim", response_model=Token)
def claim_guest(data: UserRegister, request: Request, response: Response,
                user=Depends(get_current_user), db: Session = Depends(get_db)):
    from ..services.guest_auth import COOKIE, claim
    result = claim(db, user, request.cookies.get(COOKIE), data)
    response.delete_cookie(COOKIE, path="/api/auth/guest")
    return result


@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя — не требует авторизации"""
    
    email_taken = db.query(User).filter(User.email == user_data.email).first()
    if email_taken:
        raise HTTPException(status_code=400, detail="Email already registered")

    username = allocate_username_from_email(db, user_data.email)

    # Хешируем пароль
    hashed_password = get_password_hash(user_data.password)

    new_user = User(
        username=username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        telegram_id=user_data.telegram_id,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        from ..admin.notify import notify_user_registered

        notify_user_registered(db, new_user)
    except Exception:
        import logging

        logging.getLogger(__name__).warning(
            "Admin notify failed for user_registered", exc_info=True
        )

    # Создаём токен
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        username=new_user.username
    )


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Вход в систему — не требует авторизации"""
    
    login_id = (user_data.username or "").strip()
    if "@" in login_id:
        user = db.query(User).filter(User.email == login_id.lower()).first()
    else:
        user = db.query(User).filter(User.username == login_id).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Legacy "salt:sha256" или устаревшие параметры argon2 → перехеш, пока известен пароль.
    if password_needs_rehash(user.hashed_password):
        user.hashed_password = get_password_hash(user_data.password)
        db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username
    )
