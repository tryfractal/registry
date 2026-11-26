---
name: digitalocean
description: >-
  Manage a DigitalOcean cloud account from the agent through the official
  do-mcp server. Use this skill when the user wants to create, list,
  resize, snapshot, restore, rebuild, power on/off, reboot, or destroy
  Droplets; create or scale App Platform apps; provision managed databases
  (Postgres, MySQL, Redis, MongoDB, Kafka, OpenSearch); manage Kubernetes
  clusters and node pools; configure VPCs, firewalls, load balancers, and
  floating IPs; work with Spaces object storage; manage snapshots and
  volumes; rotate API tokens; inspect billing; or tag resources. Triggers
  on phrases like "create a droplet in nyc3", "list my droplets", "resize
  this droplet to 4 GB", "spin up a postgres database", "scale my DOKS
  cluster", "open port 5432 in my firewall", "create a Spaces bucket",
  "how much have I spent this month", or any request to manage
  DigitalOcean infrastructure.
---

# DigitalOcean Skill

This skill exposes the **DigitalOcean MCP server (`do-mcp`)** as a single Fractal toolset. The server talks to the public DigitalOcean v2 REST API and the Spaces (S3-compatible) API on the user's behalf, so the agent can manage every product in the account — Droplets, App Platform, managed databases, Kubernetes, networking, storage, billing — through one connection.

## Toolset

- `mcp` — `do-mcp`, the official DigitalOcean MCP server. Spawned via `npx` and authenticated with the user's `DIGITALOCEAN_API_TOKEN` (alias: `DO_API_TOKEN`). Returns JSON for every operation and is fully compatible with the [DigitalOcean v2 API](https://docs.digitalocean.com/reference/api/).

## Capabilities at a glance

### Droplets (virtual machines)

| Tool | What it does |
|---|---|
| `droplet_list` | List all Droplets in the account, with region, size, status, IP, tags. |
| `droplet_get` | Fetch a single Droplet by ID or name. |
| `droplet_create` | Create a Droplet (region, size, image, SSH keys, backups, monitoring, tags, user data). |
| `droplet_delete` | Destroy a Droplet (irreversible — confirm first). |
| `droplet_reboot` | Soft-reboot a Droplet. |
| `droplet_power_cycle` | Power off and back on. |
| `droplet_power_on` / `droplet_power_off` | Toggle power state. |
| `droplet_shutdown` | ACPI shutdown. |
| `droplet_password_reset` | Trigger a root password reset email. |
| `droplet_resize` | Resize CPU/RAM/disk (cannot shrink disk). |
| `droplet_rename` | Rename a Droplet. |
| `droplet_rebuild` | Re-image a Droplet from a snapshot or base image. |
| `droplet_restore` | Restore a Droplet to a previous backup or snapshot. |
| `droplet_snapshot_create` | Take a snapshot of a running Droplet's disk. |
| `droplet_snapshot_list` | List all Droplet snapshots. |
| `droplet_snapshot_delete` | Delete a snapshot. |
| `droplet_backup_list` / `droplet_backup_enable` / `droplet_backup_disable` | Manage weekly backups. |
| `droplet_action_list` | List past actions for a Droplet (events, status, timestamps). |
| `droplet_neighbors` | Show other Droplets on the same physical host. |
| `droplet_kernels_list` | List available kernels for a Droplet. |
| `droplet_upgrades_list` | List valid resize targets for a Droplet. |
| `droplet_associate_floating_ip` / `droplet_dissociate_floating_ip` | Manage floating IPs. |

### App Platform

| Tool | What it does |
|---|---|
| `app_list` | List all App Platform apps. |
| `app_get` | Fetch a single app. |
| `app_create` | Create a new app from a Git repo, Docker image, or spec. |
| `app_update` | Update an app (component config, env vars, instance counts, region). |
| `app_delete` | Delete an app. |
| `app_deploy` | Trigger a deploy. |
| `app_deployment_list` / `app_deployment_get` / `app_deployment_cancel` | Manage deployments. |
| `app_logs` | Stream or fetch recent build/runtime logs. |
| `app_invoke` | Invoke an app's HTTP endpoint for health checks. |
| `app_spec_get` / `app_spec_update` | Read or replace the full app spec. |
| `app_tier_list` / `app_tier_get` | Inspect available tiers. |
| `app_rollback` | Roll back to a previous deployment. |
| `app_region_list` | List available regions. |

### Managed databases

| Tool | What it does |
|---|---|
| `database_list` | List all managed databases. |
| `database_get` | Fetch a single database by ID. |
| `database_create` | Create a new managed database (engine, size, region, version). |
| `database_delete` | Destroy a database. |
| `database_update` | Update a database (version upgrade, size, region move). |
| `database_resize` | Resize a database cluster. |
| `database_reset_password` | Reset the database admin password. |
| `database_get_ca` | Fetch the CA certificate. |
| `database_get_config` | Read the current configuration. |
| `database_update_config` | Replace the configuration. |
| `database_list_backups` / `database_get_backup` / `database_create_backup` / `database_restore_backup` / `database_delete_backup` | Backups. |
| `database_list_pools` / `database_create_pool` / `database_get_pool` / `database_update_pool` / `database_delete_pool` | Connection pools. |
| `database_list_replicas` / `database_create_replica` / `database_get_replica` / `database_delete_replica` | Read-only replicas. |
| `database_list_users` / `database_create_user` / `database_get_user` / `database_update_user` / `database_delete_user` | Users. |
| `database_list_firewall_rules` / `database_create_firewall_rule` / `database_get_firewall_rule` / `database_delete_firewall_rule` | Firewall. |
| `database_list_trusted_sources` / `database_create_trusted_source` / `database_get_trusted_source` / `database_delete_trusted_source` | Trusted sources. |
| `database_online_migration` | Start an online migration. |
| `database_metrics` | Query Prometheus metrics for a database. |
| `database_maintenance_list` / `database_maintenance_run` | Maintenance windows. |

### Kubernetes (DOKS)

| Tool | What it does |
|---|---|
| `kubernetes_cluster_list` | List DOKS clusters. |
| `kubernetes_cluster_get` | Fetch a cluster. |
| `kubernetes_cluster_create` | Create a new cluster (region, version, VPC, node pool defaults, HA). |
| `kubernetes_cluster_update` | Update a cluster (auto-upgrade, surge upgrade, etc.). |
| `kubernetes_cluster_delete` | Delete a cluster. |
| `kubernetes_cluster_upgrade` | Upgrade the control plane to a new patch / minor. |
| `kubernetes_cluster_kubeconfig` | Fetch the kubeconfig. |
| `kubernetes_node_pool_list` / `kubernetes_node_pool_get` / `kubernetes_node_pool_create` / `kubernetes_node_pool_update` / `kubernetes_node_pool_delete` / `kubernetes_node_pool_recycle` | Node pools. |

### Networking

| Tool | What it does |
|---|---|
| `vpc_list` / `vpc_get` / `vpc_create` / `vpc_update` / `vpc_delete` / `vpc_patch` | VPCs. |
| `reserved_ip_list` / `reserved_ip_get` / `reserved_ip_create` / `reserved_ip_delete` | Reserved IPs. |
| `floating_ip_list` / `floating_ip_get` / `floating_ip_create` / `floating_ip_delete` / `floating_ip_assign` / `floating_ip_unassign` | Floating IPs. |
| `firewall_list` / `firewall_get` / `firewall_create` / `firewall_update` / `firewall_delete` | Cloud firewalls. |
| `load_balancer_list` / `load_balancer_get` / `load_balancer_create` / `load_balancer_update` / `load_balancer_delete` / `load_balancer_add_droplets` / `load_balancer_remove_droplets` / `load_balancer_add_forwarding_rules` / `load_balancer_remove_forwarding_rules` | Load balancers. |
| `cdn_list` / `cdn_get` / `cdn_create` / `cdn_update` / `cdn_delete` / `cdn_purge` | CDN endpoints. |
| `domain_list` / `domain_get` / `domain_create` / `domain_delete` | DNS domains. |
| `domain_record_list` / `domain_record_get` / `domain_record_create` / `domain_record_update` / `domain_record_delete` | DNS records. |

### Storage

| Tool | What it does |
|---|---|
| `volume_list` / `volume_get` / `volume_create` / `volume_delete` / `volume_resize` / `volume_attach` / `volume_detach` / `volume_snapshot_create` / `volume_snapshot_list` / `volume_snapshot_get` / `volume_snapshot_delete` | Block storage volumes and snapshots. |
| `snapshot_list` / `snapshot_get` / `snapshot_delete` | Account-wide snapshots. |
| `image_list` / `image_get` / `image_create` / `image_update` / `image_delete` / `image_transfer` | Custom images. |
| `spaces_key_list` / `spaces_key_get` / `spaces_key_create` / `spaces_key_update` / `spaces_key_delete` | Spaces access keys. |

### Snapshots, images, and tagging

| Tool | What it does |
|---|---|
| `tag_list` / `tag_get` / `tag_create` / `tag_delete` | Tags. |
| `tag_resource` / `tag_untag_resource` | Apply or remove tags. |
| `snapshot_policy_list` / `snapshot_policy_get` / `snapshot_policy_create` / `snapshot_policy_update` / `snapshot_policy_delete` | Snapshot policies. |
| `snapshot_policy_get_snapshots` | List snapshots taken by a policy. |

### Account, billing, and SSH

| Tool | What it does |
|---|---|
| `account_get` | Account info (email, droplet limit, status, UUID). |
| `account_balance` | Current balance. |
| `billing_history_list` | Past invoices. |
| `billing_invoice_get` / `billing_invoice_summary` / `billing_invoice_csv` | Invoice details. |
| `action_get` / `action_list` | Inspect API action status. |
| `ssh_key_list` / `ssh_key_get` / `ssh_key_create` / `ssh_key_update` / `ssh_key_delete` | SSH keys. |
| `region_list` | Available regions. |
| `size_list` | Available Droplet sizes. |
| `oauth_token_list` / `oauth_token_get` / `oauth_token_create` / `oauth_token_update` / `oauth_token_delete` | OAuth tokens. |
| `partner_attachment_list` / `partner_attachment_get` / `partner_attachment_create` / `partner_attachment_update` / `partner_attachment_delete` | Partner network attachments. |
| `uptime_check_list` / `uptime_check_get` / `uptime_check_create` / `uptime_check_update` / `uptime_check_delete` | Uptime monitoring checks. |
| `alert_list` / `alert_get` | Alert policies. |

## Usage rules

- **Never run a destructive action without explicit confirmation.** `droplet_delete`, `volume_delete`, `database_delete`, `app_delete`, `cluster_delete`, `snapshot_delete`, and the destroy variants of every other resource are irreversible. Always show the user the target ID or name and ask before calling.
- **Prefer tagged resources.** Look up Droplets, databases, etc. by tag (`env:prod`, `role:web`) instead of brittle names when the user maintains tags — it survives renames.
- **Pass a unique `name` for every create.** DigitalOcean names must be lowercase, DNS-safe, and unique per resource type per region. Reuse a name only when the user explicitly asks to replace an existing one.
- **Watch the rate limit.** The v2 API allows ~5,000 req/h per token. Batch reads with the `?tag_name=` filter instead of paginating one-by-one. For bulk changes, throttle to avoid 429s.
- **Distinguish region from datacenter slug.** `nyc3`, `sfo3`, `fra1` are datacenters; the API also accepts `nyc`, `sfo`, `fra` as multi-AZ regions — pick the same slug for every resource in a deployment.
- **Read the action result, not just the 202.** Create and update endpoints return 202 + an action object. The server will follow up with the action's final status; surface `status: "errored"` to the user.
- **For Spaces, use the S3 API directly.** This MCP server is for the v2 control-plane. To upload or download objects, use the Spaces S3-compatible API (`https://<region>.digitaloceanspaces.com`) with the access keys from `spaces_key_list`.
- **Rotate tokens on the API token endpoint, not in the control panel.** `oauth_token_update` is the API path. The new token value is only returned once on create — store it before continuing.
- **For private networking, always use a VPC.** Don't rely on the legacy public-only network. New Droplets, databases, and clusters should be placed in a VPC and connected via `vpc_patch` for existing resources.
- **Kubernetes clusters have a `kubernetes_cluster_kubeconfig` tool.** Use it (not raw `doctl`) to fetch kubeconfig for the user. Save the file with 0600 perms.
- **Don't snapshot a running production DB.** Use the managed database's built-in backup (`database_create_backup`) instead of `volume_snapshot_create` — the latter can produce an inconsistent snapshot.

## Connection arguments

The toolset ships with the standard `do-mcp` launcher. The only required configuration is the API token, which is read from the `DIGITALOCEAN_API_TOKEN` (or alias `DO_API_TOKEN`) environment variable — never commit a real token to the skill folder.

| Env var | Purpose |
|---|---|
| `DIGITALOCEAN_API_TOKEN` | Personal access token. Required. |
| `DO_API_TOKEN` | Alias of the above, used by some client docs. |
| `DO_API_BASE_URL` | Override the API base (default `https://api.digitalocean.com/v2`). |
| `DO_SPACES_REGION` | Default Spaces region for S3 clients (e.g. `nyc3`). |
| `DO_HTTP_TIMEOUT_MS` | Per-request timeout in milliseconds (default `30000`). |

Common runtime flags accepted by the underlying `do-mcp` server:

| Flag | Purpose |
|---|---|
| `--readonly` | Disable every write endpoint (create, update, delete, power actions). Useful for audits and read-only agents. |
| `--no-actions` | Skip background `action` polling and return the immediate 202 response. |
| `--include <resource>` | Whitelist a specific resource group (`droplet`, `database`, `kubernetes`, etc.) to reduce the tool surface. |
| `--exclude <resource>` | Blacklist a resource group. |
| `--pretty` | Pretty-print JSON responses (default off to save tokens). |

## Spaces (S3-compatible) access

Spaces are not exposed through the MCP control-plane tools. To list buckets, upload objects, or fetch an object's metadata, use the S3 API directly with access keys obtained from `spaces_key_create` or the Spaces access keys in the control panel. Canonical endpoint pattern:

```
https://<bucket>.<region>.digitaloceanspaces.com
```

For example, a bucket `myapp-prod` in `nyc3` is reachable at `https://myapp-prod.nyc3.digitaloceanspaces.com`. Use any S3 SDK with the region's endpoint and the Spaces access key + secret.

## Auth setup

1. Sign in to the DigitalOcean control panel.
2. Open **API → Tokens/Keys** and click **Generate New Token**.
3. Give it a descriptive name (e.g. `fractal-agent`), choose **Write** scope if the agent needs to create/update/destroy resources, or **Read** for a read-only audit agent, and set an expiry.
4. Copy the token value — it is only shown once.
5. Set the token in the runtime environment: `export DIGITALOCEAN_API_TOKEN=dop_v1_...`.
6. The MCP server reads the env var on every tool call; no restart required when rotating.

For team or org-wide access, prefer an OAuth app via the OAuth API rather than a long-lived personal token.

## Security notes

- Treat every token as a credential. Never echo it in logs, commit it, or pass it through untrusted prompts. The MCP server reads it from the environment only.
- A **Write** scope token can destroy every resource in the account. Default to **Read** when the agent only needs to inspect, and require explicit confirmation for any delete or power action.
- Revoke compromised tokens immediately with `oauth_token_update` (set `scopes` to empty) or `oauth_token_delete`, and rotate the agent.
- API token access is gated by 2FA on the account — make sure the issuing account has 2FA enabled.

## References

- DigitalOcean API: <https://docs.digitalocean.com/reference/api/>
- Spaces API (S3): <https://docs.digitalocean.com/reference/api/spaces/>
- OAuth API: <https://docs.digitalocean.com/reference/api/oauth/>
- OpenAPI spec: <https://developers.digitalocean.com/documentation/v2/>
- Control panel: <https://cloud.digitalocean.com/>
- License: MIT

## Hosted MCP connection

This skill also includes a `hosted-mcp` toolset at `https://mcp.digitalocean.com/mcp`. It uses Fractal's OAuth authorization flow and discovers tools from the provider after connection. The provider must support the MCP OAuth flow used by Fractal; this endpoint was not independently authorized during registry preparation. Use the current `DigitalOcean` connector when its provider-specific setup or guidance is needed, and the hosted toolset when the user wants the provider's remote MCP server.
