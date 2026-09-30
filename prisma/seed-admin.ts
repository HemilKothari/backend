import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash(
    'password',
  );

  const user = await prisma.user.upsert({
    where: {
      email: 'admin@adonthego.in',
    },

    update: {
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },

    create: {
      name: 'Test Admin',

      email: 'admin1@adonthego.in',

      phone: '1234567890',

      passwordHash,

      role: UserRole.ADMIN,

      active: true,
    },
  });

  console.log({
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });