import { Router, Request, Response } from "express";
import { runHotelWorkflow } from "../temporal-client";
import { saveHotels, getHotelsByPrice } from "../services/redis.service";

const router = Router();

router.get("/hotels", async (req: Request, res: Response) => {
  try {
    const city = String(req.query.city || "")
      .trim()
      .toLowerCase();

    if (!city) {
      return res.status(400).json({
        error: "city query parameter is required",
      });
    }

    const minPrice =
      req.query.minPrice !== undefined && req.query.minPrice !== ""
        ? Number(req.query.minPrice)
        : undefined;

    const maxPrice =
      req.query.maxPrice !== undefined && req.query.maxPrice !== ""
        ? Number(req.query.maxPrice)
        : undefined;

    if (minPrice !== undefined && Number.isNaN(minPrice)) {
      return res.status(400).json({
        error: "minPrice must be a valid number",
      });
    }

    if (maxPrice !== undefined && Number.isNaN(maxPrice)) {
      return res.status(400).json({
        error: "maxPrice must be a valid number",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return res.status(400).json({
        error: "minPrice cannot be greater than maxPrice",
      });
    }

    const simulatedDownSupplier =
      typeof req.query.simulatedDown === "string"
        ? req.query.simulatedDown
        : typeof req.query.simulatedDownSupplier === "string"
        ? req.query.simulatedDownSupplier
        : undefined;

    let hotels: any[] = [];
    try {
      // Execute orchestration workflow via Temporal
      hotels = await runHotelWorkflow(city, simulatedDownSupplier);

      // Save deduplicated hotel offers in Redis Sorted Set
      await saveHotels(city, hotels);
    } catch (workflowErr: any) {
      console.warn("[API] Temporal workflow execution failed/bypassed. Attempting Redis fallback:", workflowErr?.message || workflowErr);
    }

    // Query Redis for price-filtered hotel offers
    const filteredHotels = await getHotelsByPrice(city, minPrice, maxPrice);

    return res.json(filteredHotels);
  } catch (error: any) {
    console.error("Hotel API error:", error);

    return res.status(500).json({
      error: "Failed to fetch hotel offers",
      details: error?.message || String(error)
    });
  }
});

export default router;

