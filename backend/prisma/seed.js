require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const seedUsers = [
  {
    name: 'Admin Absensi',
    email: 'admin@absensiles.local',
    password: 'Admin1234!',
    role: 'admin',
  },
  {
    name: 'Tutor Demo',
    email: 'tutor@absensiles.local',
    password: 'Tutor1234!',
    role: 'tutor',
  },
  {
    name: 'Siswa Demo',
    email: 'student@absensiles.local',
    password: 'Student1234!',
    role: 'student',
  },
  {
    name: 'Siswa Dua',
    email: 'student2@absensiles.local',
    password: 'Student1234!',
    role: 'student',
  },
];

async function upsertUser(user) {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      password: hashedPassword,
      role: user.role,
    },
    create: {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

async function main() {
  const users = [];

  for (const user of seedUsers) {
    users.push(await upsertUser(user));
  }

  console.log('Seed berhasil dijalankan. Akun siap pakai:');
  for (const user of users) {
    console.log(`- ${user.role}: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
