import { Router } from "express";

// Models
import User from '../models/User';
import Drawing from "../models/Drawing";

// Controllers
import CRUDController from "../controllers/CRUDController";

//Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";

// Instantiate error message factory
const errorMessageFactory: errorFactory = new errorFactory();

// Create an Express router instance
const router = Router();

// API prefix used for all routes
export const API_PREFIX = '/api';

// CRUD Routes for Users
// router.post(`${API_PREFIX}/users`, async (req: any, res: any) => CRUDController.createRecord(User, req, res));
// router.get(`${API_PREFIX}/users/:id`, async (req: any, res: any) => CRUDController.readOneRecord(User, req, res));
// router.delete(`${API_PREFIX}/users/:id`, async (req: any, res: any) => CRUDController.deleteRecord(User, req, res));
// router.put(`${API_PREFIX}/users/:id`, async (req: any, res: any) => CRUDController.updateRecord(User, req, res));

// CRUD Routes for Drawings
router.post(`${API_PREFIX}/drawings`, async (req: any, res: any) => CRUDController.createRecord(Drawing, req, res));
router.get(`${API_PREFIX}/drawings/:id`, async (req: any, res: any) => CRUDController.readOneRecord(Drawing, req, res));
router.delete(`${API_PREFIX}/drawings/:id`, async (req: any, res: any) => CRUDController.deleteRecord(Drawing, req, res));
router.put(`${API_PREFIX}/drawings/:id`, async (req: any, res: any) => CRUDController.updateRecord(Drawing, req, res));

// Export the router to be used in the main application
export default router;