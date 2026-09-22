import { Connection, WorkflowClient } from "@temporalio/client";
import { hotelWorkflow } from "./workflows/hotel.workflow";

const temporalAddress =
  process.env.TEMPORAL_ADDRESS || "localhost:7233";

let connection: Connection | undefined;
let workflowClient: WorkflowClient | undefined;

export async function getWorkflowClient() {
  if (!connection) {
    connection = await Connection.connect({
      address: temporalAddress
    });
  }

  if (!workflowClient) {
    workflowClient = new WorkflowClient({
      connection
    });
  }

  return workflowClient;
}

export async function runHotelWorkflow(
  city: string,
  simulatedDownSupplier?: string
) {
  const client = await getWorkflowClient();

  const handle = await client.start(hotelWorkflow, {
    args: [city, simulatedDownSupplier],
    taskQueue: "hotel-task-queue",
    workflowId: `hotel-${city.toLowerCase()}-${Date.now()}`
  });

  return handle.result();
}

export async function checkTemporalHealth(): Promise<boolean> {
  try {
    const healthPromise = (async () => {
      const client = await getWorkflowClient();
      return Boolean(client && client.connection);
    })();

    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), 1500)
    );

    return await Promise.race([healthPromise, timeoutPromise]);
  } catch {
    return false;
  }
}