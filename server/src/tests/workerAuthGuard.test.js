import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service.js';
import { applyWorker, approveWorker, rejectWorker } from '../controllers/worker.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== WORKER REGISTRATION AUTHENTICATION GUARD & APPROVAL STATUS TEST ===");

  const testEmail = `test.worker.${Date.now()}@example.com`;
  const name = "Test Worker Guard";
  const phone = "1234567890";
  const specialization = ["LED_TECHNICIAN"];
  const experienceYrs = 5;

  console.log(`\nStep 1: Applying for worker account with email: ${testEmail}...`);
  const reqApply = {
    body: {
      name,
      email: testEmail,
      phone,
      experienceYrs,
      specialization,
    },
  };

  let resData = null;
  const resApply = {
    status: (code) => {
      assert.strictEqual(code, 201, `Apply should return status 201, got ${code}`);
      return resApply;
    },
    json: (data) => {
      resData = data;
      return resApply;
    },
  };

  await applyWorker(reqApply, resApply);
  assert.ok(resData.success, "Worker application creation failed");

  // Retrieve worker profile and user from database
  const profile = await prisma.workerProfile.findUnique({
    where: { userId: resData.data.userId },
    include: { user: true },
  });

  assert.strictEqual(profile.status, 'PENDING', "Worker profile status must initially be PENDING");
  assert.strictEqual(profile.user.status, 'PENDING', "User status must initially be PENDING");
  assert.strictEqual(profile.user.isActive, false, "User must initially be inactive");
  console.log("✅ Step 1 Passed: Worker applied successfully. Statuses are PENDING, isActive is false.");

  console.log("\nStep 2: Simulating login attempt for the PENDING worker...");
  try {
    await AuthService.authenticateUserWithGoogle({
      email: testEmail,
      name,
      requestedRole: 'WORKER',
    });
    assert.fail("Login should have failed for PENDING worker");
  } catch (error) {
    assert.strictEqual(error.statusCode, 403, `Expected status 403, got ${error.statusCode}`);
    assert.strictEqual(error.code, 'WORKER_APPLICATION_PENDING', `Expected code WORKER_APPLICATION_PENDING, got ${error.code}`);
    console.log("   -> Login blocked when requesting WORKER role.");
  }

  try {
    await AuthService.authenticateUserWithGoogle({
      email: testEmail,
      name,
      requestedRole: 'CUSTOMER',
    });
    assert.fail("Login should have failed for PENDING worker requesting CUSTOMER role");
  } catch (error) {
    assert.strictEqual(error.statusCode, 403, `Expected status 403, got ${error.statusCode}`);
    assert.strictEqual(error.code, 'WORKER_APPLICATION_PENDING', `Expected code WORKER_APPLICATION_PENDING, got ${error.code}`);
    console.log("   -> Login blocked when requesting CUSTOMER role.");
  }
  console.log("✅ Step 2 Passed: Login blocked with WORKER_APPLICATION_PENDING for both requested roles.");

  console.log("\nStep 3: Rejecting worker application...");
  const reqReject = {
    params: { id: profile.id },
  };
  const resReject = {
    status: (code) => {
      assert.strictEqual(code, 200, `Reject should return status 200, got ${code}`);
      return resReject;
    },
    json: (data) => {
      assert.ok(data.success, "Rejection action failed");
      return resReject;
    },
  };

  await rejectWorker(reqReject, resReject);

  // Check updated statuses
  const rejectedUser = await prisma.user.findUnique({ where: { email: testEmail } });
  const rejectedProfile = await prisma.workerProfile.findUnique({ where: { userId: rejectedUser.id } });

  assert.strictEqual(rejectedUser.status, 'REJECTED', "User status must update to REJECTED");
  assert.strictEqual(rejectedProfile.status, 'REJECTED', "WorkerProfile status must update to REJECTED");
  assert.strictEqual(rejectedUser.isActive, false, "User must remain inactive on rejection");
  console.log("✅ Step 3 Passed: Rejection successfully marked user and worker profile status as REJECTED.");

  console.log("\nStep 4: Simulating login attempt for the REJECTED worker...");
  try {
    await AuthService.authenticateUserWithGoogle({
      email: testEmail,
      name,
      requestedRole: 'WORKER',
    });
    assert.fail("Login should have failed for REJECTED worker");
  } catch (error) {
    assert.strictEqual(error.statusCode, 403, `Expected status 403, got ${error.statusCode}`);
    assert.strictEqual(error.code, 'WORKER_APPLICATION_REJECTED', `Expected code WORKER_APPLICATION_REJECTED, got ${error.code}`);
    console.log("   -> Login blocked when requesting WORKER role.");
  }

  try {
    await AuthService.authenticateUserWithGoogle({
      email: testEmail,
      name,
      requestedRole: 'CUSTOMER',
    });
    assert.fail("Login should have failed for REJECTED worker requesting CUSTOMER role");
  } catch (error) {
    assert.strictEqual(error.statusCode, 403, `Expected status 403, got ${error.statusCode}`);
    assert.strictEqual(error.code, 'WORKER_APPLICATION_REJECTED', `Expected code WORKER_APPLICATION_REJECTED, got ${error.code}`);
    console.log("   -> Login blocked when requesting CUSTOMER role.");
  }
  console.log("✅ Step 4 Passed: Login blocked with WORKER_APPLICATION_REJECTED for both requested roles.");

  console.log("\nStep 5: Approving worker application...");
  const reqApprove = {
    params: { id: profile.id },
  };
  const resApprove = {
    status: (code) => {
      assert.strictEqual(code, 200, `Approve should return status 200, got ${code}`);
      return resApprove;
    },
    json: (data) => {
      assert.ok(data.success, "Approval action failed");
      return resApprove;
    },
  };

  await approveWorker(reqApprove, resApprove);

  // Check updated statuses
  const approvedUser = await prisma.user.findUnique({ where: { email: testEmail } });
  const approvedProfile = await prisma.workerProfile.findUnique({ where: { userId: approvedUser.id } });

  assert.strictEqual(approvedUser.status, 'APPROVED', "User status must update to APPROVED");
  assert.strictEqual(approvedProfile.status, 'APPROVED', "WorkerProfile status must update to APPROVED");
  assert.strictEqual(approvedUser.isActive, true, "User must be active on approval");
  console.log("✅ Step 5 Passed: Approval successfully updated statuses to APPROVED and set isActive to true.");

  console.log("\nStep 6: Simulating login attempt for the APPROVED worker...");
  const authResult = await AuthService.authenticateUserWithGoogle({
    email: testEmail,
    name,
    requestedRole: 'WORKER',
  });

  assert.ok(authResult.token, "Login should return JWT token on success");
  assert.strictEqual(authResult.user.email, testEmail, "Logged user email should match");
  console.log("✅ Step 6 Passed: Login succeeds and returns JWT payload.");

  console.log("\nStep 7: Cleaning up test records...");
  await new Promise((resolve) => setTimeout(resolve, 600));
  await prisma.auditLog.deleteMany({ where: { actorId: approvedUser.id } });
  await prisma.workerProfile.delete({ where: { id: profile.id } });
  await prisma.user.delete({ where: { id: approvedUser.id } });
  console.log("✅ Step 7 Passed: Test user cleanup completed.");

  await prisma.$disconnect();
  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
