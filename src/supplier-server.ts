import express from "express";

const app = express();
const PORT = Number(process.env.SUPPLIER_PORT) || 4000;

const supplierAHotels = [
  {
    hotelId: "a1",
    name: "Holtin",
    price: 6000,
    city: "delhi",
    commissionPct: 10,
  },
  {
    hotelId: "a2",
    name: "Radison",
    price: 5900,
    city: "delhi",
    commissionPct: 13,
  },
  {
    hotelId: "a3",
    name: "Taj Palace",
    price: 8500,
    city: "delhi",
    commissionPct: 15,
  },
  {
    hotelId: "a4",
    name: "Marriott",
    price: 7200,
    city: "delhi",
    commissionPct: 12,
  },
  {
    hotelId: "a5",
    name: "Oberoi",
    price: 9500,
    city: "delhi",
    commissionPct: 14,
  },
  {
    hotelId: "a6",
    name: "Trident",
    price: 4800,
    city: "mumbai",
    commissionPct: 10,
  }
];

const supplierBHotels = [
  {
    hotelId: "b1",
    name: "Holtin",
    price: 5340,
    city: "delhi",
    commissionPct: 20,
  },
  {
    hotelId: "b2",
    name: "Radison",
    price: 6200,
    city: "delhi",
    commissionPct: 11,
  },
  {
    hotelId: "b3",
    name: "Taj Palace",
    price: 8100,
    city: "delhi",
    commissionPct: 16,
  },
  {
    hotelId: "b4",
    name: "Leela Palace",
    price: 9000,
    city: "delhi",
    commissionPct: 18,
  },
  {
    hotelId: "b5",
    name: "ITC Maurya",
    price: 6800,
    city: "delhi",
    commissionPct: 15,
  },
  {
    hotelId: "b6",
    name: "Trident",
    price: 5100,
    city: "mumbai",
    commissionPct: 12,
  }
];

app.get("/supplierA/hotels", (req, res) => {
  const city = String(req.query.city || "").toLowerCase();
  const simulatedDown = req.query.simulatedDown === "true" || req.query.down === "true";

  if (simulatedDown) {
    return res.status(500).json({ error: "Supplier A is currently unavailable (Simulated Downtime)" });
  }

  const hotels = supplierAHotels.filter((hotel) => hotel.city === city);
  return res.json(hotels);
});

app.get("/supplierB/hotels", (req, res) => {
  const city = String(req.query.city || "").toLowerCase();
  const simulatedDown = req.query.simulatedDown === "true" || req.query.down === "true";

  if (simulatedDown) {
    return res.status(500).json({ error: "Supplier B is currently unavailable (Simulated Downtime)" });
  }

  const hotels = supplierBHotels.filter((hotel) => hotel.city === city);
  return res.json(hotels);
});

app.get("/health", (_req, res) => {
  return res.json({ status: "ok", message: "Mock Suppliers running" });
});

app.listen(PORT, () => {
  console.log(`Supplier server running on port ${PORT}`);
});

