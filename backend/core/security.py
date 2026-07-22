from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt
from passlib.context import CryptContext
from core.config import settings

# Configure passlib to use bcrypt and optionally support legacy WordPress phpass
pwd_context = CryptContext(
    schemes=["bcrypt", "phpass"], 
    deprecated=["phpass"],
    bcrypt__rounds=12
)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify the password against the hash.
    If the hash is a deprecated phpass, passlib handles it.
    """
    return pwd_context.verify(plain_password, hashed_password)

def needs_password_rehash(hashed_password: str) -> bool:
    """
    Check if the hash needs to be upgraded (e.g., it is phpass or an old bcrypt round).
    """
    return pwd_context.needs_update(hashed_password)

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token
    except jwt.PyJWTError:
        return None
