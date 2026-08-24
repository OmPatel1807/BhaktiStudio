import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service.js';
import { promoteUserToAdmin } from '../controllers/admin.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== CO-ADMIN DELEGATION & WORKER BYPASS INTEGRATION TEST ===");

  const testEmail = `test.promotion.${Date.now()}@example.com`;
  const name = "Candidate Admin";

  // Create a pending worker user in the database
  console.log(`\nStep 1: Creating a pending worker: ${testEmail}...`);
  const workerUser = await prisma.user.create({
    data: {
      email: testEmail,
      name,
      role: 'WORKER',
      isActive: false,
      status: 'PENDING',
      workerProfile: {
        create: {
          specialization: ['LED_TECHNICIAN'],
          status: 'PENDING',
        },
      },
    },
    include: {
      workerProfile: true,
    },
  });

  assert.strictEqual(workerUser.role, 'WORKER');
  assert.strictEqual(workerUser.status, 'PENDING');
  console.log("✅ Step 1 Passed: Pending worker created.");

  console.log("\nStep 2: Simulating login attempt for pending worker...");
  try {
    await AuthService.authenticateUserWithGoogle({
      email: testEmail,
      name,
      requestedRole: 'WORKER',
    });
    assert.fail("Login should have failed for pending worker");
  } catch (error) {
    assert.strictEqual(error.statusCode, 403);
    assert.strictEqual(error.code, 'WORKER_APPLICATION_PENDING');
    console.log("✅ Step 2 Passed: Login blocked correctly.");
  }

  console.log("\nStep 3: Promoting user to ADMIN role...");
  const reqPromote = {
    body: { email: testEmail },
  };

  let resData = null;
  const resPromote = {
    status: (code) => {
      assert.strictEqual(code, 200, `Promote should return 200, got ${code}`);
      return resPromote;
    },
    json: (data) => {
      resData = data;
      return resPromote;
    },
  };

  await promoteUserToAdmin(reqPromote, resPromote);
  assert.ok(resData.success);

  // Check database state
  const updatedUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  assert.strictEqual(updatedUser.role, 'ADMIN', "User role must be updated to ADMIN");
  assert.strictEqual(updatedUser.status, 'APPROVED', "User status must be APPROVED");
  assert.strictEqual(updatedUser.isActive, true, "User must be active");
  console.log("✅ Step 3 Passed: User successfully promoted to ADMIN role.");

  console.log("\nStep 4: Simulating login for the promoted ADMIN...");
  const authResult = await AuthService.authenticateUserWithGoogle({
    email: testEmail,
    name,
    requestedRole: 'ADMIN',
  });

  assert.ok(authResult.token, "Login should succeed and issue a JWT token");
  assert.strictEqual(authResult.user.role, 'ADMIN', "Token payload role must be ADMIN");
  console.log("✅ Step 4 Passed: Admin login successfully bypassed all worker guards.");

  console.log("\nStep 5: Cleaning up test records...");
  await prisma.workerProfile.delete({ where: { userId: updatedUser.id } });
  await prisma.user.delete({ where: { id: updatedUser.id } });
  console.log("✅ Step 5 Passed: Clean up completed.");

  await prisma.$disconnect();
  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
