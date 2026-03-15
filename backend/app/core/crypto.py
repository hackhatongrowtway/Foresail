"""
Cryptography utilities for encrypting/decrypting API tokens.
"""
import os
from cryptography.fernet import Fernet
from fastapi import HTTPException

# In production, this MUST be a strong, fixed key stored in environment variables!
# E.g., generated with: Fernet.generate_key().decode()
# For the hackathon, we'll try to get it from ENV, or fallback to a temporary one (NOT secure across restarts)
ENCRYPTION_KEY = os.getenv("FERNET_ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    print("⚠️ WARNING: FERNET_ENCRYPTION_KEY not found in .env. Using temporary key. Tokens will be lost on restart!")
    ENCRYPTION_KEY = Fernet.generate_key().decode()

cipher_suite = Fernet(ENCRYPTION_KEY.encode())


def encrypt_token(token: str) -> str:
    """Encrypt a plain text token."""
    if not token:
        return ""
    try:
        encrypted_bytes = cipher_suite.encrypt(token.encode("utf-8"))
        return encrypted_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encrypt token: {e}")


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt an encrypted token."""
    if not encrypted_token:
        return ""
    try:
        decrypted_bytes = cipher_suite.decrypt(encrypted_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt token. Invalid key or corrupted data.")
