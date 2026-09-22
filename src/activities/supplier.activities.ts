import { Hotel } from "../types/hotel";

const SUPPLIER_BASE_URL =
  process.env.SUPPLIER_BASE_URL || "http://localhost:4000";

export async function fetchSupplierAHotels(
  city: string,
  simulatedDown?: boolean
): Promise<Hotel[]> {
  console.log(`[Activity: Supplier A] Fetching offers for city: '${city}' (simulatedDown: ${Boolean(simulatedDown)})`);
  try {
    const query = new URLSearchParams({ city });
    if (simulatedDown) query.append("down", "true");

    const response = await fetch(`${SUPPLIER_BASE_URL}/supplierA/hotels?${query.toString()}`);

    if (!response.ok) {
      console.warn(`[Activity: Supplier A] HTTP ${response.status} - ${response.statusText}`);
      return [];
    }

    const hotels = await response.json();
    console.log(`[Activity: Supplier A] Received ${hotels.length} hotel offers for '${city}'`);

    return hotels.map((hotel: Omit<Hotel, "supplier">) => ({
      ...hotel,
      supplier: "Supplier A"
    }));
  } catch (error: any) {
    console.error(`[Activity: Supplier A] Error fetching from Supplier A: ${error?.message || error}`);
    // Fallback: return empty array so workflow can continue with available suppliers
    return [];
  }
}

export async function fetchSupplierBHotels(
  city: string,
  simulatedDown?: boolean
): Promise<Hotel[]> {
  console.log(`[Activity: Supplier B] Fetching offers for city: '${city}' (simulatedDown: ${Boolean(simulatedDown)})`);
  try {
    const query = new URLSearchParams({ city });
    if (simulatedDown) query.append("down", "true");

    const response = await fetch(`${SUPPLIER_BASE_URL}/supplierB/hotels?${query.toString()}`);

    if (!response.ok) {
      console.warn(`[Activity: Supplier B] HTTP ${response.status} - ${response.statusText}`);
      return [];
    }

    const hotels = await response.json();
    console.log(`[Activity: Supplier B] Received ${hotels.length} hotel offers for '${city}'`);

    return hotels.map((hotel: Omit<Hotel, "supplier">) => ({
      ...hotel,
      supplier: "Supplier B"
    }));
  } catch (error: any) {
    console.error(`[Activity: Supplier B] Error fetching from Supplier B: ${error?.message || error}`);
    // Fallback: return empty array so workflow can continue with available suppliers
    return [];
  }
}