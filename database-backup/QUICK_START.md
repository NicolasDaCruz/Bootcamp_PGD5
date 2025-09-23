# Quick Start Guide
## Database Backup System

**🚀 Run Complete Backup (Recommended)**

```bash
cd database-backup/scripts
./run-full-backup.sh
```

**📋 Individual Backups**

```bash
# Schema only
./backup-schemas.sh

# Data only
./backup-data.sh

# JSON only
./backup-critical-json.sh

# Verification
./verify-backups.sh
```

**📁 Backup Locations**

- **Schemas**: `database-backup/schemas/latest_schema.sql`
- **Data**: `database-backup/data/latest_data.sql`
- **JSON**: `database-backup/json/latest_combined.json`
- **Logs**: `database-backup/verification/latest_verification.log`

**🔧 Prerequisites**

1. Supabase CLI: `npm install -g supabase`
2. Node.js (for JSON exports)
3. Project environment file (`.env.local`)

**📖 Full Documentation**

See `README.md` for complete instructions, recovery procedures, and troubleshooting.

---

*Generated for Database Reorganization Task #1*