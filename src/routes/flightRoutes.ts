import { AirportController } from "@/controllers/airportController";
import { FlightController } from "@/controllers/flightController";
import { requireAuth } from "@/middleware/authMiddleware";
import { Router } from "express";

const flightRoutes = Router();

// Airport routes
flightRoutes.get("/airports", AirportController.getAirports);
flightRoutes.post("/airports", requireAuth, AirportController.addAirport);
flightRoutes.patch("/airports/:code", requireAuth, AirportController.updateAirport);
flightRoutes.delete("/airports/:code", requireAuth, AirportController.deleteAirport);
flightRoutes.delete("/airports", requireAuth, AirportController.deleteAllAirports);
flightRoutes.post("/airports/import", requireAuth, AirportController.importAirports);

// Pricing rules routes
flightRoutes.get("/pricing-rules", AirportController.getPricingRules);
flightRoutes.patch("/pricing-rules", requireAuth, AirportController.updatePricingRules);

// Flight management routes
flightRoutes.post("/import", requireAuth, FlightController.importFlights);
flightRoutes.delete("/", requireAuth, FlightController.deleteAllFlights);

// Flight routes
flightRoutes.get("/", FlightController.getAllFlights);
flightRoutes.get("/:id", FlightController.getFlightById);
flightRoutes.post("/", requireAuth, FlightController.createFlight);
flightRoutes.patch("/:id", requireAuth, FlightController.updateFlight);
flightRoutes.delete("/:id", requireAuth, FlightController.deleteFlight);

export default flightRoutes;
