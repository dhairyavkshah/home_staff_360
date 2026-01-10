# Database Migration Checklist & Procedures

## Overview
This document outlines the formal procedures for safely managing database schema changes when the Home Staff 360 application has live users and production data.

---

## Pre-Migration Checklist

### Before Any Schema Change
- [ ] **Identify Change Type**: Is this a breaking or non-breaking change?
- [ ] **Document the Change**: Write down exactly what columns/tables are being added, modified, or removed
- [ ] **Impact Assessment**: List all features/screens that will be affected
- [ ] **User Communication**: Determine if users need to be notified of downtime or changes

### Environment Verification
- [ ] Development database is separate from production
- [ ] DATABASE_URL environment variable correctly points to the right environment
- [ ] Confirm which environment you are working in before running any commands

---

## Change Categories

### Non-Breaking Changes (Safe to Apply Directly)
These changes can be applied without data loss:
- Adding new tables
- Adding new nullable columns
- Adding new columns with default values
- Adding new indexes
- Adding new constraints (with validation that existing data complies)

### Breaking Changes (Require Phased Approach)
These changes require careful planning:
- Removing columns or tables
- Renaming columns or tables
- Changing column data types
- Adding NOT NULL constraints to existing columns
- Modifying primary keys or foreign keys

---

## Migration Procedures

### Procedure A: Non-Breaking Schema Changes

**Step 1: Development Testing**
```bash
# 1. Make schema changes in shared/schema.ts
# 2. Generate migration
npx drizzle-kit generate

# 3. Review the generated SQL in /drizzle folder
# 4. Apply to development database
npx drizzle-kit push
```

**Step 2: Verification**
- [ ] Test all affected features in development
- [ ] Verify existing data is accessible
- [ ] Check that new columns/tables are created correctly
- [ ] Run application and confirm no errors

**Step 3: Production Deployment**
- [ ] **BACKUP PRODUCTION DATABASE** (see Backup Procedures below)
- [ ] Deploy application code changes
- [ ] Migration runs automatically on deployment
- [ ] Verify production is working correctly
- [ ] Monitor for errors for 24 hours

---

### Procedure B: Breaking Schema Changes (Phased Approach)

Breaking changes must be done in phases to prevent data loss:

**Phase 1: Add New Structure**
- Add new columns/tables alongside existing ones
- Deploy code that writes to BOTH old and new structures
- Do NOT remove old columns yet

**Phase 2: Data Migration**
- Run background job to copy/transform existing data to new structure
- Verify all data has been migrated correctly
- Keep dual-write active

**Phase 3: Switch Reads**
- Update application to read from new structure
- Continue writing to both old and new
- Monitor for issues

**Phase 4: Remove Old Structure**
- After confirming everything works (wait at least 1 week)
- Remove old columns/tables
- Remove dual-write code

---

## Backup Procedures

### Before Any Production Migration

**Option 1: Replit Database Panel**
1. Open your Replit project
2. Go to the Database panel (in Tools)
3. Click "Create Backup" or "Export"
4. Save the backup file securely

**Option 2: Manual Backup via SQL**
```sql
-- Export specific tables (run in development to test)
-- Use the database panel's export feature for full backups
```

### Backup Retention
- Keep backups for at least 30 days
- Label backups with date and description of changes
- Store critical backups externally (download to local machine)

---

## Rollback Procedures

### If Migration Fails in Production

**Immediate Actions:**
1. **Do NOT panic** - assess the situation
2. Check error logs for specific issues
3. Determine if app is still functional

**If App is Broken:**
1. Use Replit's checkpoint system to restore previous code version
2. Restore database from backup if needed
3. Notify users of temporary downtime if applicable

**If Data is Corrupted:**
1. Stop the application immediately
2. Restore database from most recent backup
3. Redeploy previous working version
4. Investigate cause before attempting migration again

---

## Communication Checklist

### For Minor Changes (No Downtime)
- [ ] No user notification needed
- [ ] Deploy during low-traffic hours if possible

### For Major Changes (Potential Downtime)
- [ ] Notify users 24-48 hours in advance
- [ ] Provide estimated downtime duration
- [ ] Send "we're back" notification after completion

---

## Post-Migration Verification

### Immediately After Deployment
- [ ] Application loads without errors
- [ ] Users can log in
- [ ] Core features work (attendance, expenses, etc.)
- [ ] Data displays correctly
- [ ] No error toasts or warnings

### 24-Hour Monitoring
- [ ] Check error logs daily
- [ ] Monitor user feedback
- [ ] Verify all scheduled jobs run correctly
- [ ] Confirm real-time features (Socket.IO) work

---

## Quick Reference Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push

# View current database state
npx drizzle-kit studio

# Check migration status (shows pending migrations)
npx drizzle-kit check
```

---

## Emergency Contacts & Resources

- **Replit Support**: For platform-specific issues
- **Database Panel**: Tools > Database in Replit
- **Checkpoints**: Version control for code rollbacks
- **This Document**: Reference for all migration procedures

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Initial document creation | Agent |

---

## Summary Decision Tree

```
Schema Change Needed?
    │
    ├── Non-Breaking (add column/table)?
    │   └── Follow Procedure A
    │       └── Backup → Test Dev → Deploy → Monitor
    │
    └── Breaking (remove/rename/change type)?
        └── Follow Procedure B (Phased)
            └── Add New → Migrate Data → Switch Reads → Remove Old
```

**Remember**: When in doubt, ask before proceeding. Data loss is permanent.
