// Adaptateur HTTP exclusivement local pour les essais UI. Les permissions sont
// appliquées par le vrai PostgreSQL éphémère, pas simulées dans les composants.
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { asRole, ADMIN_ID, USER_ID, placeOrder } from "./local-database.mjs";
export const PREVIEW_KEY = "test-public-key-local-only";
export function createPreviewApi(db) {
  const imageObjects = new Map();
  const sessions = new Map(); const refreshTokens = new Map();
  const jwtSecret = crypto.randomUUID();
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  function session(user) {
    const content = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", email: user.email, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}`;
    const token = `${content}.${createHmac("sha256", jwtSecret).update(content).digest("base64url")}`;
    const refresh = crypto.randomUUID(); sessions.set(token, user); refreshTokens.set(refresh, user);
    return { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: refresh, user };
  }
  const users = { "admin@example.test": { id: ADMIN_ID, email: "admin@example.test", aud: "authenticated", role: "authenticated", email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email" }, user_metadata: {}, identities: [] },
    "client@example.test": { id: USER_ID, email: "client@example.test", aud: "authenticated", role: "authenticated", email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email" }, user_metadata: {}, identities: [] } };
  const identifier = (value) => { if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("Invalid identifier"); return `"${value}"`; };
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (["http://localhost:3220", "http://127.0.0.1:3220"].includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "apikey, authorization, content-type, x-client-info, prefer, accept, x-supabase-api-version");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS,HEAD");
    res.setHeader("Access-Control-Expose-Headers", "content-range");
    const send = (status, data) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(status === 204 ? undefined : JSON.stringify(data)); };
    if (req.method === "OPTIONS") return send(204);
    const publicImagePath = req.url?.split('?')[0]?.replace('/storage/v1/object/public/service-images/','');
    if (req.method==='GET' && req.url?.startsWith('/storage/v1/object/public/service-images/')) {
      const bytes=imageObjects.get(publicImagePath);
      if(!bytes) return send(404,{message:'Image not found'});
      res.writeHead(200,{'Content-Type':'image/webp'}); return res.end(bytes);
    }
    if (req.headers.apikey !== PREVIEW_KEY) return send(401, { code: "INVALID_KEY", message: "Local test key required" });
    try {
      const url = new URL(req.url, "http://127.0.0.1:54329");
      const chunks = []; let length = 0;
      const storageUpload = url.pathname.startsWith('/storage/v1/object/service-images/') && req.method==='POST';
      for await (const chunk of req) { length += chunk.length; if (length > (storageUpload?5242880:128000)) throw new Error("Request too large"); chunks.push(chunk); }
      const body = storageUpload ? {} : chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
      const token = req.headers.authorization?.replace(/^Bearer /i, ""); const user = sessions.get(token);
      if (url.pathname === "/auth/v1/token") {
        const selected = url.searchParams.get("grant_type") === "refresh_token" ? refreshTokens.get(body.refresh_token) : body.password === "local-test-only" ? users[body.email] : null;
        return selected ? send(200, session(selected)) : send(400, { error_code: "invalid_credentials", msg: "Invalid local credentials" });
      }
      if (url.pathname === "/auth/v1/user") return user ? send(200, user) : send(401, { msg: "No local session", error_code: "bad_jwt" });
      if (url.pathname === "/auth/v1/logout") { sessions.delete(token); return send(204); }
      if (token && token !== PREVIEW_KEY && !user) return send(401, { message: "Invalid local session" });
      const role = user ? "authenticated" : "anon";
      if(storageUpload){
        const path=decodeURIComponent(url.pathname.replace('/storage/v1/object/service-images/',''));
        await asRole(db,role,user?.id,(tx)=>tx.query("insert into storage.objects(bucket_id,name) values('service-images',$1)",[path]));
        imageObjects.set(path,Buffer.concat(chunks));
        return send(200,{Key:`service-images/${path}`,Id:crypto.randomUUID()});
      }
      if(url.pathname==='/storage/v1/object/service-images' && req.method==='DELETE'){
        const removed=[];
        for(const path of body.prefixes??[]){
          const result=await asRole(db,role,user?.id,(tx)=>tx.query("delete from storage.objects where bucket_id='service-images' and name=$1 returning name",[path]));
          if(result.rows.length){imageObjects.delete(path);removed.push({name:path});}
        }
        return send(200,removed);
      }
      if (url.pathname === "/rest/v1/rpc/tz_is_catalogue_admin") {
        const data = await asRole(db, role, user?.id, async (tx) => (await tx.query("select public.tz_is_catalogue_admin() as allowed")).rows[0].allowed);
        return send(200, data);
      }
      if (url.pathname === "/rest/v1/rpc/tz_place_order") return send(200, await asRole(db, role, user?.id, (tx) => placeOrder(tx, body)));
      if (url.pathname === "/rest/v1/rpc/tz_catalogue_revision") return send(200, await asRole(db, role, user?.id, async (tx) => (await tx.query("select public.tz_catalogue_revision() as revision")).rows[0].revision));
      const table = url.pathname.replace("/rest/v1/", "");
      if (!["products", "categories", "shop_settings", "orders"].includes(table)) return send(404, { code: "PGRST205", message: "Unknown local table" });
      const data = await asRole(db, role, user?.id, async (tx) => {
        // Sérialisation PostgreSQL native, comme PostgREST : conserve les
        // microsecondes des versions updated_at utilisées contre les conflits.
        async function rows(sql, args) {
          const wrapped = sql.startsWith("select") ? `select to_jsonb(r) as row from (${sql}) r` : `with r as (${sql}) select to_jsonb(r) as row from r`;
          return (await tx.query(wrapped, args)).rows.map((r) => r.row);
        }
        const args = []; const filters = [];
        for (const [key, value] of url.searchParams) {
          if (["select", "order", "limit", "offset"].includes(key)) continue;
          const column = identifier(key);
          if (value === "is.null") filters.push(`${column} is null`);
          else if (value.startsWith("eq.")) { args.push(value.slice(3)); filters.push(`${column}=$${args.length}`); }
          else throw new Error("Unsupported local filter");
        }
        const where = filters.length ? ` where ${filters.join(" and ")}` : "";
        const select = url.searchParams.get("select") ?? "*";
        const columns = select === "*" ? "*" : select.split(",").map(identifier).join(",");
        if (req.method === "GET" || req.method === "HEAD") {
          const order = url.searchParams.get("order"); const [column, direction] = order?.split(".") ?? [];
          return rows(`select ${columns} from public.${identifier(table)}${where}${column ? ` order by ${identifier(column)} ${direction === "desc" ? "desc" : "asc"}` : ""}`, args);
        }
        if (req.method === "PATCH") {
          const sets = Object.entries(body).map(([key, value]) => { args.push(typeof value === "object" && value !== null ? JSON.stringify(value) : value); return `${identifier(key)}=$${args.length}`; });
          return rows(`update public.${identifier(table)} set ${sets.join(",")}${where} returning ${columns}`, args);
        }
        if (req.method === "DELETE") return rows(`delete from public.${identifier(table)}${where} returning ${columns}`, args);
        if (req.method === "POST") {
          const values = Array.isArray(body) ? body : [body]; const inserted = [];
          for (const row of values) {
            const entries = Object.entries(row);
            const result = await rows(`insert into public.${identifier(table)} (${entries.map(([key]) => identifier(key)).join(",")}) values (${entries.map((_, i) => `$${i + 1}`).join(",")}) returning ${columns}`, entries.map(([, value]) => typeof value === "object" && value !== null ? JSON.stringify(value) : value));
            inserted.push(...result);
          }
          return inserted;
        }
        throw new Error("Unsupported local method");
      });
      if (req.method === "HEAD") return send(200);
      if (req.headers.accept?.includes("application/vnd.pgrst.object+json")) {
        return data.length === 1 ? send(200, data[0]) : send(406, { code: "PGRST116", details: `The result contains ${data.length} rows`, message: "Expected one row" });
      }
      if (!["GET", "HEAD"].includes(req.method) && !req.headers.prefer?.includes("return=representation")) return send(204);
      return send(200, data);
    } catch (error) { return send(400, { code: error.code ?? "LOCAL_TEST_ERROR", message: error.message }); }
  });
}
