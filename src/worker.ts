import { Worker } from "@temporalio/worker";
import * as activities from "./activities/supplier.activities";

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve("./workflows/hotel.workflow"),
    activities,
    taskQueue: "hotel-task-queue"
  });

  console.log("Temporal worker started");

  await worker.run();
}

run().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});