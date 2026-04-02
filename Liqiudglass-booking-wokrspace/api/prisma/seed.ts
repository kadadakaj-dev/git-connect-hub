import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "tenant_1" },
    update: {},
    create: {
      name: "Tenant 1",
      slug: "tenant_1",
      timezone: "Europe/Bratislava"
    }
  });

  await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      providerKey: "mock",
      baseUrl: "https://mock.local",
      settings: { source: "seed" },
      secretsEnc: "{}",
      isEnabled: true
    }
  });

  const email = "demo@booking.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("DemoPass123!", salt);
    await prisma.user.create({
      data: {
        email,
        salt,
        passwordHash
      }
    });
  }

  const email2 = "test@test.com";
  const existing2 = await prisma.user.findUnique({ where: { email: email2 } });
  if (!existing2) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("test_pass", salt);
    await prisma.user.create({
      data: {
        email: email2,
        salt,
        passwordHash
      }
    });
  }
  const email3 = "admin";
  const existing3 = await prisma.user.findUnique({ where: { email: email3 } });
  if (!existing3) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("admin123", salt);
    await prisma.user.create({
      data: {
        email: email3,
        salt,
        passwordHash
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
