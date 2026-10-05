import { parseBody, sendJson, supabaseRequest, validateLead } from "../lib/api-utils.js";
import { getSession, requireAuth } from "../lib/auth.js";
import { demoLeads } from "../lib/demo-leads.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!getSession(req)) return sendJson(res, 200, demoLeads);
    try {
      const leads = await supabaseRequest("leads?select=id,name,company,email,event,notes,follow_up_status,created_at,updated_at&order=created_at.desc");
      return sendJson(res, 200, leads || []);
    } catch (error) {
      return sendJson(res, 503, { error: error.message || "Could not load leads." });
    }
  }

  if (req.method === "POST") {
    if (!requireAuth(req, res)) return;
    let input;
    try { input = parseBody(req); } catch { return sendJson(res, 400, { error: "Request body must be valid JSON." }); }
    const checked = validateLead(input);
    if (checked.error) return sendJson(res, 400, { error: checked.error });
    try {
      const created = await supabaseRequest("leads?select=id,name,company,email,event,notes,follow_up_status,created_at,updated_at", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(checked.value),
      });
      return sendJson(res, 201, created?.[0] || {});
    } catch (error) {
      return sendJson(res, 503, { error: error.message || "Could not create this lead." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed." });
}

