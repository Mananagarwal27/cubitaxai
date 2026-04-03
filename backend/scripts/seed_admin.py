
import asyncio
import uuid
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash
from sqlalchemy import select

async def seed_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        result = await db.execute(select(User).where(User.email == "admin@cubitax.ai"))
        user = result.scalar_one_or_none()
        
        if user:
            print("Admin user already exists.")
            # Optionally update password here if needed
            user.hashed_password = get_password_hash("password123")
            await db.commit()
            print("Admin password updated to 'password123'.")
        else:
            admin = User(
                id=uuid.uuid4(),
                email="admin@cubitax.ai",
                full_name="System Admin",
                company_name="CubitaxAI",
                hashed_password=get_password_hash("password123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            await db.commit()
            print("Created admin user: admin@cubitax.ai / password123")

if __name__ == "__main__":
    asyncio.run(seed_admin())
