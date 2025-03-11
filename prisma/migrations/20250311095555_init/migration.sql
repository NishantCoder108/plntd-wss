-- CreateTable
CREATE TABLE "DBTransaction" (
    "id" SERIAL NOT NULL,
    "signature" TEXT NOT NULL,
    "adminWalletAddress" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "fromUserAccount" TEXT NOT NULL,
    "toUserAccount" TEXT NOT NULL,
    "txnDescription" TEXT,
    "feePayer" TEXT,
    "txnTimestamp" BIGINT NOT NULL,
    "fee" BIGINT,
    "txnType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DBTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DBTransaction_signature_key" ON "DBTransaction"("signature");
