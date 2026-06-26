import { FractalToolset } from "@fractal-os/plugin";

/**
 * DigitalOcean MCP toolset.
 *
 * Spawns the official `do-mcp` server, which proxies every DigitalOcean v2
 * REST API endpoint as a structured MCP tool. Authentication is read from
 * the `DIGITALOCEAN_API_TOKEN` (alias: `DO_API_TOKEN`) environment variable.
 *
 * Scope of tools exposed (auto-discovered by the runtime from do-mcp):
 *   - Droplets, snapshots, images, backups
 *   - App Platform apps, deployments, logs
 *   - Managed databases (Postgres, MySQL, Redis, MongoDB, Kafka, OpenSearch)
 *   - Kubernetes (DOKS) clusters and node pools
 *   - Networking: VPCs, reserved IPs, floating IPs, firewalls, load balancers,
 *     CDN, DNS domains and records
 *   - Storage: volumes, volume snapshots, Spaces access keys
 *   - Account, billing, SSH keys, snapshots policies, tags
 *   - Uptime checks, alerts, OAuth tokens
 *
 * Spaces (S3-compatible object storage) is NOT proxied through this MCP
 * server — use the S3 API directly with keys from `spaces_key_create`.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Manage a DigitalOcean cloud account through the official do-mcp server. Wraps the v2 REST API and exposes every DigitalOcean product — Droplets, App Platform, managed databases, Kubernetes (DOKS), VPCs, firewalls, load balancers, floating IPs, block storage, Spaces access keys, snapshots, images, SSH keys, DNS, CDN, account, billing, and tags — as structured MCP tools. Authenticated via the DIGITALOCEAN_API_TOKEN (or DO_API_TOKEN) environment variable.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Address resources by tag (`env:prod`, `role:web`) when the user maintains tags — tag lookups survive renames, name lookups do not.",
    },
    {
      type: "always",
      instruction:
        "Filter list endpoints with the `?tag_name=` query (or equivalent tool parameter) instead of paginating one-by-one, to stay under the 5,000 req/h rate limit and save tokens.",
    },
    {
      type: "always",
      instruction:
        "When the user creates a new resource, suggest a name that is lowercase, DNS-safe, unique per resource type per region, and reflects the resource's purpose (e.g. `prod-postgres-01`, `web-droplet-nyc3`).",
    },
    {
      type: "always",
      instruction:
        "For Kubernetes, fetch the kubeconfig with the dedicated `kubernetes_cluster_kubeconfig` tool (not the doctl CLI) and write the file with 0600 permissions.",
    },
    {
      type: "always",
      instruction:
        "Place new Droplets, databases, and clusters in a VPC. Use `vpc_create` first if the user doesn't already have one for the target region, then pass the VPC UUID to the create call.",
    },
    {
      type: "always",
      instruction:
        "For Spaces object storage (buckets and object upload/download), use the S3-compatible Spaces API directly (`https://<bucket>.<region>.digitaloceanspaces.com`) with the access keys from `spaces_key_create`. do-mcp does not proxy object operations.",
    },
    {
      type: "never",
      instruction:
        "Never call any destructive endpoint — `droplet_delete`, `volume_delete`, `database_delete`, `app_delete`, `kubernetes_cluster_delete`, `snapshot_delete`, `image_delete`, `firewall_delete`, `load_balancer_delete`, `cdn_delete`, `domain_delete`, `oauth_token_delete`, etc. — without first showing the user the exact target ID/name and receiving an explicit confirmation.",
    },
    {
      type: "never",
      instruction:
        "Never snapshot a running production database with `volume_snapshot_create` — it can be inconsistent. Use the managed database's built-in `database_create_backup` instead.",
    },
    {
      type: "never",
      instruction:
        "Never log, echo, or write the value of `DIGITALOCEAN_API_TOKEN` to disk, chat, or any code file. Reference it as `${DIGITALOCEAN_API_TOKEN}` only.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "do-mcp@latest"],
    env: {
      DIGITALOCEAN_API_TOKEN: "${DIGITALOCEAN_API_TOKEN}",
    },
  })
  .build();
