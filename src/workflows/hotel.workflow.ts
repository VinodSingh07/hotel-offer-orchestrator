import { proxyActivities, log } from "@temporalio/workflow";
import type * as activities from "../activities/supplier.activities";

const {
  fetchSupplierAHotels,
  fetchSupplierBHotels
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 2,
  }
});

export async function hotelWorkflow(
  city: string,
  simulatedDownSupplier?: string
) {
  log.info(`[Workflow] Starting hotel search workflow for city: ${city}, simulatedDown: ${simulatedDownSupplier || "none"}`);

  const isADown = simulatedDownSupplier === "supplierA";
  const isBDown = simulatedDownSupplier === "supplierB";

  // Execute supplier fetches in parallel
  const [supplierAHotels, supplierBHotels] = await Promise.all([
    fetchSupplierAHotels(city, isADown),
    fetchSupplierBHotels(city, isBDown)
  ]);

  log.info(`[Workflow] Fetched ${supplierAHotels.length} offers from Supplier A and ${supplierBHotels.length} from Supplier B`);

  const allHotels = [...supplierAHotels, ...supplierBHotels];

  // Map to deduplicate by hotel name (case-insensitive) keeping the lowest price
  const hotelMap = new Map<string, (typeof allHotels)[number]>();

  for (const hotel of allHotels) {
    const key = hotel.name.trim().toLowerCase();
    const existing = hotelMap.get(key);

    if (!existing) {
      hotelMap.set(key, hotel);
    } else {
      // Compare prices: keep the cheaper offer
      if (hotel.price < existing.price) {
        log.info(`[Workflow] Lower price found for '${hotel.name}': ${hotel.price} (${hotel.supplier}) vs ${existing.price} (${existing.supplier})`);
        hotelMap.set(key, hotel);
      }
    }
  }

  const result = Array.from(hotelMap.values()).sort((a, b) => a.price - b.price);
  log.info(`[Workflow] Deduplication complete. Returning ${result.length} best offers.`);

  return result;
}