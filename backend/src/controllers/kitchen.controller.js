import { getActiveTickets, removeTicket, updateTicketStatus } from "../services/kitchen.service.js";

async function getKitchenTickets(_req, res) {
  try {
    const tickets = await getActiveTickets();
    res.json(
      tickets.map((ticket) => ({
        ...ticket,
        items: ticket.items ? ticket.items.split("||") : [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch kitchen tickets." });
  }
}

async function patchKitchenTicket(req, res) {
  try {
    const result = await updateTicketStatus({
      ticketId: req.params.ticketId,
      userId: req.user?.sub ?? req.user?.userId ?? req.body?.userId,
      status: req.body?.status,
    });
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to update kitchen ticket.",
      details: error.details ?? [],
    });
  }
}

async function deleteKitchenTicket(req, res) {
  try {
    const result = await removeTicket({
      ticketId: req.params.ticketId,
      userId: req.user?.sub ?? req.user?.userId ?? req.body?.userId,
    });
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    res.status(statusCode).json({
      error: error.message || "Failed to remove kitchen ticket.",
      details: error.details ?? [],
    });
  }
}

export { deleteKitchenTicket, getKitchenTickets, patchKitchenTicket };
