/**
 * TRANSFER METADATA API ROUTES
 * 
 * Admin endpoints for managing Stripe Connect transfer metadata
 * Provides complete payment-to-payout traceability
 */

import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import {
  createTransferWithMetadata,
  updateTransferMetadata,
  bulkUpdateTransferMetadata,
  getTransferWithMetadata,
} from "../services/transferMetadataService.js";

const router = Router();

/**
 * Create a new transfer with comprehensive metadata
 * POST /api/admin/transfers/create-with-metadata
 */
router.post("/create-with-metadata", isAdmin, async (req, res) => {
  try {
    const {
      amount,
      connectAccountId,
      sourceTransactionId,
      teamId,
      eventId,
      description,
    } = req.body;

    if (!amount || !connectAccountId || !sourceTransactionId || !teamId || !eventId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["amount", "connectAccountId", "sourceTransactionId", "teamId", "eventId"],
      });
    }

    console.log(`🔄 Admin ${req.user?.email} creating transfer with metadata for Team ${teamId}`);

    const result = await createTransferWithMetadata({
      amount: parseInt(amount),
      connectAccountId,
      sourceTransactionId,
      teamId: parseInt(teamId),
      eventId: parseInt(eventId),
      description,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Transfer created with comprehensive metadata`,
        transferId: result.transferId,
        metadata: result.metadata,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to create transfer with metadata`,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error("Error creating transfer with metadata:", error);
    res.status(500).json({
      error: "Failed to create transfer with metadata",
      details: error.message,
    });
  }
});

/**
 * Update existing transfer with metadata
 * POST /api/admin/transfers/update-metadata
 */
router.post("/update-metadata", isAdmin, async (req, res) => {
  try {
    const { transferId, teamId, eventId } = req.body;

    if (!transferId || !teamId || !eventId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["transferId", "teamId", "eventId"],
      });
    }

    console.log(`🔄 Admin ${req.user?.email} updating transfer metadata for ${transferId}`);

    const result = await updateTransferMetadata({
      transferId,
      teamId: parseInt(teamId),
      eventId: parseInt(eventId),
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Transfer metadata updated successfully`,
        transferId: result.transferId,
        metadata: result.metadata,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to update transfer metadata`,
        transferId,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error("Error updating transfer metadata:", error);
    res.status(500).json({
      error: "Failed to update transfer metadata",
      details: error.message,
    });
  }
});

/**
 * Bulk update multiple transfers with metadata
 * POST /api/admin/transfers/bulk-update-metadata
 */
router.post("/bulk-update-metadata", isAdmin, async (req, res) => {
  try {
    const { transfers } = req.body;

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).json({
        error: "Missing or invalid transfers array",
        expected: "Array of {transferId, teamId, eventId} objects",
      });
    }

    console.log(`🚀 Admin ${req.user?.email} triggered bulk transfer metadata update for ${transfers.length} transfers`);

    const result = await bulkUpdateTransferMetadata(transfers);

    res.json({
      success: true,
      message: `Bulk transfer metadata update complete: ${result.successful}/${transfers.length} successful`,
      summary: {
        totalTransfers: transfers.length,
        successful: result.successful,
        failed: result.failed,
      },
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error in bulk transfer metadata update:", error);
    res.status(500).json({
      error: "Failed to update transfer metadata",
      details: error.message,
    });
  }
});

/**
 * Get transfer details with metadata verification
 * GET /api/admin/transfers/:transferId/metadata
 */
router.get("/:transferId/metadata", isAdmin, async (req, res) => {
  try {
    const { transferId } = req.params;

    if (!transferId) {
      return res.status(400).json({ error: "Transfer ID required" });
    }

    const result = await getTransferWithMetadata(transferId);

    if (result.error) {
      return res.status(404).json({
        error: "Transfer not found",
        transferId,
        details: result.error,
      });
    }

    res.json({
      success: true,
      transferId,
      hasMetadata: result.hasMetadata,
      metadataKeys: result.metadataKeys,
      transfer: {
        id: result.transfer?.id,
        amount: result.transfer?.amount,
        destination: result.transfer?.destination,
        created: result.transfer?.created,
        description: result.transfer?.description,
        metadata: result.transfer?.metadata,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving transfer metadata:", error);
    res.status(500).json({
      error: "Failed to retrieve transfer metadata",
      details: error.message,
    });
  }
});

/**
 * Get summary of transfer metadata coverage
 * GET /api/admin/transfers/metadata-summary
 */
router.get("/metadata-summary", isAdmin, async (req, res) => {
  try {
    // This would require querying Stripe for transfer statistics
    // For now, return guidance on available endpoints
    res.json({
      success: true,
      message: "Transfer metadata management endpoints",
      endpoints: {
        createWithMetadata: "POST /api/admin/transfers/create-with-metadata",
        updateMetadata: "POST /api/admin/transfers/update-metadata", 
        bulkUpdate: "POST /api/admin/transfers/bulk-update-metadata",
        getMetadata: "GET /api/admin/transfers/:transferId/metadata",
      },
      benefits: [
        "Complete payment-to-payout traceability",
        "Enhanced financial reconciliation",
        "Improved audit compliance",
        "Streamlined customer service",
      ],
    });
  } catch (error: any) {
    console.error("Error getting transfer metadata summary:", error);
    res.status(500).json({
      error: "Failed to get transfer metadata summary",
      details: error.message,
    });
  }
});

export default router;