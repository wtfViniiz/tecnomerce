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

  // ── Shipping Methods ──────────────────────────────────
  const pacMethod = await prisma.shippingMethod.upsert({
    where: { code: "pac" },
    update: {},
    create: {
      code: "pac",
      name: "PAC",
      type: "STANDARD",
      isActive: true,
      sortOrder: 1
    }
  });

  const sedexMethod = await prisma.shippingMethod.upsert({
    where: { code: "sedex" },
    update: {},
    create: {
      code: "sedex",
      name: "SEDEX",
      type: "EXPRESS",
      isActive: true,
      sortOrder: 2
    }
  });

  const freeMethod = await prisma.shippingMethod.upsert({
    where: { code: "frete-gratis" },
    update: {},
    create: {
      code: "frete-gratis",
      name: "Frete Grátis",
      type: "STANDARD",
      isActive: true,
      sortOrder: 0
    }
  });

  // ── Shipping Rules ──────────────────────────────────
  // PAC: nacional
  await prisma.shippingRule.upsert({
    where: { id: "seed-rule-pac-national" },
    update: {},
    create: {
      id: "seed-rule-pac-national",
      shippingMethodId: pacMethod.id,
      postalCodeStart: "00000000",
      postalCodeEnd: "99999999",
      priceCents: 2490,
      currencyCode: "BRL",
      estimatedMinDays: 5,
      estimatedMaxDays: 10,
      minimumOrderAmountCents: null,
      isActive: true
    }
  });

  // SEDEX: nacional
  await prisma.shippingRule.upsert({
    where: { id: "seed-rule-sedex-national" },
    update: {},
    create: {
      id: "seed-rule-sedex-national",
      shippingMethodId: sedexMethod.id,
      postalCodeStart: "00000000",
      postalCodeEnd: "99999999",
      priceCents: 4990,
      currencyCode: "BRL",
      estimatedMinDays: 1,
      estimatedMaxDays: 3,
      minimumOrderAmountCents: null,
      isActive: true
    }
  });

  // Frete Grátis: pedidos acima de R$199,90
  await prisma.shippingRule.upsert({
    where: { id: "seed-rule-free-national" },
    update: {},
    create: {
      id: "seed-rule-free-national",
      shippingMethodId: freeMethod.id,
      postalCodeStart: "00000000",
      postalCodeEnd: "99999999",
      priceCents: 0,
      currencyCode: "BRL",
      estimatedMinDays: 5,
      estimatedMaxDays: 15,
      minimumOrderAmountCents: 19990,
      isActive: true
    }
  });

  // ── Coupons ─────────────────────────────────────────
  const now = new Date();
  const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: {
      code: "BEMVINDO10",
      type: "PERCENTAGE",
      valueCentsOrPercentage: 10,
      currencyCode: "BRL",
      status: "ACTIVE",
      maxUses: null,
      maxUsesPerUser: 1,
      startsAt: now,
      expiresAt: sixMonths,
      minimumOrderAmountCents: 9990,
      isStackable: false
    }
  });

  // CouponRestriction: BEMVINDO10 only applies to products in specific categories
  // No restrictions = applies to all products (default behavior)
  // Uncomment below to restrict to specific category:
  /*
  const bemvindo10 = await prisma.coupon.findUnique({ where: { code: "BEMVINDO10" } });
  if (bemvindo10) {
    await prisma.couponRestriction.create({
      data: {
        couponId: bemvindo10.id,
        categoryId: someCategoryId, // Set specific category ID
        productId: null
      }
    });
  }
  */

  await prisma.coupon.upsert({
    where: { code: "FRETEGRATIS" },
    update: {},
    create: {
      code: "FRETEGRATIS",
      type: "FIXED",
      valueCentsOrPercentage: 2490,
      currencyCode: "BRL",
      status: "ACTIVE",
      maxUses: 100,
      maxUsesPerUser: 1,
      startsAt: now,
      expiresAt: sixMonths,
      minimumOrderAmountCents: null,
      isStackable: false
    }
  });
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
