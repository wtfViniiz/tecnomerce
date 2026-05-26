-- CreateTable
CREATE TABLE "CouponRestriction" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,

    CONSTRAINT "CouponRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouponRestriction_couponId_idx" ON "CouponRestriction"("couponId");

-- CreateIndex
CREATE INDEX "CouponRestriction_productId_idx" ON "CouponRestriction"("productId");

-- CreateIndex
CREATE INDEX "CouponRestriction_categoryId_idx" ON "CouponRestriction"("categoryId");

-- AddForeignKey
ALTER TABLE "CouponRestriction" ADD CONSTRAINT "CouponRestriction_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRestriction" ADD CONSTRAINT "CouponRestriction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRestriction" ADD CONSTRAINT "CouponRestriction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
