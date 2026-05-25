import argon2 from "argon2";
import { PrismaClient, UserType } from "@prisma/client";

const prisma = new PrismaClient();

const customerRoleName = "customer";
const adminRoleName = "admin";

const permissions = [
  { name: "admin:access", resource: "admin", action: "access", description: "Admin access" },
  { name: "product:delete", resource: "product", action: "delete", description: "Delete products" },
  { name: "permission:update", resource: "permission", action: "update", description: "Update permissions" },
  { name: "refund:create", resource: "refund", action: "create", description: "Create refunds" },
  { name: "credential:update", resource: "credential", action: "update", description: "Update credentials" },
  { name: "admin:update", resource: "admin", action: "update", description: "Update admins" },
  { name: "analytics:sensitive-read", resource: "analytics", action: "sensitive-read", description: "Read sensitive analytics" }
];

const fabrics = [
  {
    slug: "algodao-premium",
    name: "Algodao Premium",
    description: "Tecido base premium",
    composition: "100% algodao",
    breathability: "alta",
    weight: "180g",
    advantages: "conforto",
    status: "PUBLISHED"
  }
];

const sizes = [
  { slug: "p", name: "P", sortOrder: 1, status: "PUBLISHED" },
  { slug: "m", name: "M", sortOrder: 2, status: "PUBLISHED" },
  { slug: "g", name: "G", sortOrder: 3, status: "PUBLISHED" }
];

const colors = [
  { slug: "preto", name: "Preto", hexCode: "#000000", sortOrder: 1, status: "PUBLISHED" },
  { slug: "branco", name: "Branco", hexCode: "#FFFFFF", sortOrder: 2, status: "PUBLISHED" }
];

const run = async (): Promise<void> => {
  const customerRole = await prisma.role.upsert({
    where: { name: customerRoleName },
    update: {},
    create: {
      name: customerRoleName,
      description: "Default customer role",
      isSystem: true
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: adminRoleName },
    update: {},
    create: {
      name: adminRoleName,
      description: "Administrative role",
      isSystem: true
    }
  });

  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    });
    createdPermissions.push(created);
  }

  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  for (const fabric of fabrics) {
    await prisma.fabric.upsert({
      where: { slug: fabric.slug },
      update: fabric,
      create: fabric
    });
  }

  for (const size of sizes) {
    await prisma.sizeOption.upsert({
      where: { slug: size.slug },
      update: size,
      create: size
    });
  }

  for (const color of colors) {
    await prisma.colorOption.upsert({
      where: { slug: color.slug },
      update: color,
      create: color
    });
  }

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const adminName = process.env.ADMIN_BOOTSTRAP_NAME ?? "Admin Bootstrap";

  if (adminEmail && adminPassword) {
    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id
    });

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        passwordHash,
        userType: UserType.ADMIN,
        isActive: true
      },
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        userType: UserType.ADMIN,
        isActive: true,
        emailVerified: true,
        twoFaEnabled: false,
        twoFaBackupHashes: []
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
  }

  const _ = customerRole;
};

run()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
