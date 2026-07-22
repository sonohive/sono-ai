from datetime import datetime, timedelta, timezone
from typing import Any, Union
import jwt
import bcrypt
from passlib.context import CryptContext
from core.config import settings

# Configure passlib ONLY for legacy WordPress phpass
pwd_context = CryptContext(
    schemes=["phpass"], 
)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify the password against the hash.
    If the hash is a deprecated phpass, passlib handles it.
    Otherwise, we use the modern bcrypt library directly.
    """
    if hashed_password.startswith("$P$") or hashed_password.startswith("$H$"):
        return pwd_context.verify(plain_password, hashed_password)
    
    # Bcrypt verification
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def needs_password_rehash(hashed_password: str) -> bool:
    """
    Check if the hash needs to be upgraded (e.g., it is a legacy phpass).
    """
    if hashed_password.startswith("$P$") or hashed_password.startswith("$H$"):
        return True
    return False

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
