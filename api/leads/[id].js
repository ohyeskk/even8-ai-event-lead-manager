import { parseBody, sendJson, supabaseRequest, validateLead } from "../../lib/api-utils.js";
import { requireAuth } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const id = req.query?.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return sendJson(res, 400, { error: "Invalid lead ID." });

  if (req.method === "PATCH") {
    let input;
    try { input = parseBody(req); } catch { return sendJson(res, 400, { error: "Request body must be valid JSON." }); }
    const checked = validateLead(input, { partial: true });
    if (checked.error) return sendJson(res, 400, { error: checked.error });
    if (Object.keys(checked.value).length === 0) return sendJson(res, 400, { error: "Provide at least one field to update." });
    try {
      const updated = await supabaseRequest(`leads?id=eq.${encodeURIComponent(id)}&select=id,name,company,email,event,notes,follow_up_status,created_at,updated_at`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...checked.value, updated_at: new Date().toISOString() }),
      });
      if (!updated?.length) return sendJson(res, 404, { error: "Lead not found." });
      return sendJson(res, 200, updated[0]);
    } catch (error) {
      return sendJson(res, 503, { error: error.message || "Could not update this lead." });
    }
  }

  if (req.method === "DELETE") {
    try {
      const deleted = await supabaseRequest(`leads?id=eq.${encodeURIComponent(id)}&select=id`, {
        method: "DELETE",
        headers: { Prefer: "return=representation" },
      });
      if (!deleted?.length) return sendJson(res, 404, { error: "Lead not found." });
      return sendJson(res, 200, { deleted: true });
    } catch (error) {
      return sendJson(res, 503, { error: error.message || "Could not delete this lead." });
    }
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return sendJson(res, 405, { error: "Method not allowed." });
}

