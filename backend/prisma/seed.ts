import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

const DAY_MS = 86_400_000;

function daysFromNow(offset: number): Date {
  return new Date(Date.now() + offset * DAY_MS);
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@taskmanager.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
      role: "ADMIN",
    },
  });

  const demoEmail = "demo@taskmanager.local";
  const demoPassword = "Demo123!";
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 10),
      name: "Demo User",
    },
  });

  // Deterministic sample data: reset the demo user's tasks on every seed run
  await prisma.task.deleteMany({ where: { userId: demo.id } });
  await prisma.task.createMany({
    data: [
      { userId: demo.id, title: "Prepare project kickoff notes", description: "Agenda, goals and open questions for Monday.", status: "TODO", priority: "HIGH", dueDate: daysFromNow(2) },
      { userId: demo.id, title: "Review design mockups", description: "Leave comments on the new dashboard screens.", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(1) },
      { userId: demo.id, title: "Fix flaky signup test", status: "TODO", priority: "HIGH", dueDate: daysFromNow(-1) },
      { userId: demo.id, title: "Update dependency versions", description: "Patch releases only.", status: "DONE", priority: "LOW", dueDate: daysFromNow(-3) },
      { userId: demo.id, title: "Write release notes", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(5) },
      { userId: demo.id, title: "Plan sprint retrospective", status: "TODO", priority: "LOW" },
      { userId: demo.id, title: "Refactor settings page", description: "Split the form into sections.", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(7) },
      { userId: demo.id, title: "Archive old reports", status: "DONE", priority: "LOW", dueDate: daysFromNow(-7) },
      { userId: demo.id, title: "Set up error monitoring", description: "Alerts for 5xx spikes.", status: "TODO", priority: "HIGH", dueDate: daysFromNow(3) },
      { userId: demo.id, title: "Book conference tickets", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(14) },
    ],
  });

  console.log("Seed complete:");
  console.log(`  admin → ${adminEmail} / ${adminPassword}`);
  console.log(`  demo  → ${demoEmail} / ${demoPassword} (10 sample tasks)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
