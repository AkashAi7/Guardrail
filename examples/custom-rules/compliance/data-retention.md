---
title: Data Retention Policy Compliance
severity: HIGH
category: Compliance
---

# Data Retention Policy Compliance

## What to Detect

Code that stores personal data, logs, or business records without implementing proper data retention policies. Look for:

- Database schemas without retention metadata (created_at, retention_until, etc.)
- Log configurations without rotation or expiration
- File storage without lifecycle policies
- User data collection without defined retention periods
- Missing data deletion/archival jobs

## Why It Matters

**Legal Requirements:**
Many regulations require organizations to:
- Delete personal data when no longer needed (GDPR Article 5(1)(e))
- Retain business records for specific periods (SOX, FINRA)
- Provide data deletion upon user request (GDPR Article 17, CCPA)

**Compliance Impact:**
- GDPR Article 5(1)(e) - Storage Limitation (HIGH)
- GDPR Article 17 - Right to Erasure (HIGH)
- CCPA - Right to Deletion (HIGH)
- SOX - Record Retention Requirements (MEDIUM)
- Company Data Retention Policy v2.1 (REQUIRED)

**Business Risk:**
- Regulatory fines for non-compliance (up to 4% of annual revenue under GDPR)
- Increased storage costs
- Data breach exposure (more data = more risk)
- Inability to fulfill deletion requests

## Examples of Violations

❌ **BAD - Database table without retention policy:**
```sql
-- VIOLATION: No retention metadata
CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- VIOLATION: No scheduled cleanup
-- This data will accumulate forever
```

❌ **BAD - Logging without rotation:**
```javascript
// VIOLATION: Logs stored indefinitely
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'application.log'
      // No maxsize, no maxFiles, no retention policy
    })
  ]
});

// VIOLATION: Logging PII without retention
logger.info(`User ${email} performed action ${action}`);
```

❌ **BAD - S3 bucket without lifecycle:**
```javascript
// VIOLATION: Files stored forever
const s3 = new AWS.S3();

await s3.putObject({
  Bucket: 'user-uploads',
  Key: `documents/${userId}/${filename}`,
  Body: fileContent
  // No lifecycle policy, no expiration
});
```

❌ **BAD - Mongoose model without retention:**
```javascript
// VIOLATION: No retention strategy
const UserActivitySchema = new mongoose.Schema({
  userId: ObjectId,
  action: String,
  createdAt: { type: Date, default: Date.now }
  // Missing: retentionPeriod, deletedAt fields
});
```

❌ **BAD - User data without deletion capability:**
```javascript
// VIOLATION: No way to delete user data
app.post('/api/users', async (req, res) => {
  const user = await User.create({
    email: req.body.email,
    name: req.body.name,
    // Missing: data retention metadata
  });
  res.json(user);
});

// VIOLATION: No DELETE endpoint for GDPR compliance
```

## How to Fix

✅ **GOOD - Database with retention policy:**
```sql
-- Proper retention metadata
CREATE TABLE user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    retention_period INTERVAL DEFAULT '90 days',
    retention_until TIMESTAMP GENERATED ALWAYS AS (created_at + retention_period) STORED,
    INDEX idx_retention_until (retention_until)
);

-- Scheduled cleanup job
CREATE OR REPLACE FUNCTION delete_expired_logs() 
RETURNS void AS $$
BEGIN
    DELETE FROM user_activity_logs 
    WHERE retention_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run daily
SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT delete_expired_logs()');
```

✅ **GOOD - Winston with rotation:**
```javascript
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      zippedArchive: true
    })
  ]
});

// Redact PII before logging
const redactPII = (data) => {
  return { ...data, email: '***@***.com' };
};

logger.info('User action', redactPII({ userId, action }));
```

✅ **GOOD - S3 with lifecycle policy:**
```javascript
const s3 = new AWS.S3();

// Apply lifecycle policy
await s3.putBucketLifecycleConfiguration({
  Bucket: 'user-uploads',
  LifecycleConfiguration: {
    Rules: [{
      Id: 'DeleteOldUploads',
      Status: 'Enabled',
      Expiration: { Days: 365 }, // Delete after 1 year
      Transitions: [{
        Days: 90,
        StorageClass: 'GLACIER' // Archive after 90 days
      }]
    }]
  }
});

// Tag objects with retention metadata
await s3.putObject({
  Bucket: 'user-uploads',
  Key: `documents/${userId}/${filename}`,
  Body: fileContent,
  Tagging: 'retention-period=365&data-classification=user-content'
});
```

✅ **GOOD - Mongoose with TTL index:**
```javascript
const UserActivitySchema = new mongoose.Schema({
  userId: { type: ObjectId, required: true },
  action: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  retentionPeriod: { 
    type: Number, 
    default: 90 * 24 * 60 * 60, // 90 days in seconds
    required: true 
  }
});

// TTL index for automatic deletion
UserActivitySchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60,
    name: 'activity_ttl'
  }
);

const UserActivity = mongoose.model('UserActivity', UserActivitySchema);
```

✅ **GOOD - User data with deletion capability:**
```javascript
// Provide data deletion endpoint (GDPR Article 17)
app.delete('/api/users/:id/data', requireAuth, async (req, res) => {
  const userId = req.params.id;
  
  // Verify user owns this data or is admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Delete user data across all systems
  await Promise.all([
    User.deleteOne({ _id: userId }),
    UserActivity.deleteMany({ userId }),
    UserPreferences.deleteOne({ userId }),
    s3.deleteObjects({
      Bucket: 'user-uploads',
      Delete: {
        Objects: await listUserFiles(userId)
      }
    })
  ]);

  // Log deletion for audit trail
  await AuditLog.create({
    action: 'user_data_deletion',
    userId,
    requestedBy: req.user.id,
    timestamp: new Date()
  });

  res.json({ success: true, message: 'All user data deleted' });
});

// Scheduled job for automatic retention
cron.schedule('0 3 * * *', async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year retention

  // Delete inactive users after retention period
  const inactiveUsers = await User.find({
    lastLogin: { $lt: cutoffDate },
    accountStatus: 'inactive'
  });

  for (const user of inactiveUsers) {
    await deleteUserData(user._id);
    console.log(`Deleted data for inactive user: ${user._id}`);
  }
});
```

✅ **GOOD - Document retention in schema:**
```typescript
interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLogin: Date;
  
  // Retention metadata
  dataRetentionPolicy: {
    category: 'user_account' | 'user_activity' | 'user_content';
    retentionPeriod: number; // days
    autoDeleteAfterInactivity: boolean;
    inactivityPeriod?: number; // days
  };
  
  // Deletion metadata
  deletionScheduledAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
}
```

## Detection Patterns

Look for:

1. **Database tables without retention:**
   - No `created_at` timestamp
   - No `retention_until` or `expires_at` field
   - No TTL indexes
   - No scheduled cleanup jobs

2. **Logging without lifecycle:**
   - Log files without rotation
   - No `maxFiles` or `maxSize` configuration
   - Console.log in production
   - Logs containing PII without redaction

3. **Storage without policies:**
   - S3 buckets without lifecycle rules
   - File uploads without expiration
   - No archival strategy

4. **Missing deletion endpoints:**
   - No `/users/:id/data` DELETE endpoint
   - No batch deletion jobs
   - No audit trail for deletions

## Severity Assignment

- **CRITICAL:** Personal data stored indefinitely without deletion mechanism
- **HIGH:** Business records without compliant retention policy
- **MEDIUM:** Logs or analytics data without rotation
- **LOW:** Non-sensitive temporary data without cleanup

## Remediation Checklist

- [ ] Identify all data storage locations (DB, S3, logs, cache, etc.)
- [ ] Define retention periods for each data category
- [ ] Add retention metadata to database schemas
- [ ] Implement TTL indexes or scheduled cleanup jobs
- [ ] Configure log rotation and expiration
- [ ] Apply lifecycle policies to object storage
- [ ] Create data deletion endpoints (GDPR compliance)
- [ ] Document retention policies in code and wiki
- [ ] Set up monitoring for retention job failures
- [ ] Test deletion workflows
- [ ] Create audit trail for all deletions

## Company Policy Requirements

According to Company Data Retention Policy v2.1:

| Data Category | Retention Period | Action After Period |
|--------------|------------------|---------------------|
| User Account Data | Active + 90 days after account closure | Delete |
| User Activity Logs | 90 days | Delete |
| User Content | 365 days or until user deletes | Delete/Archive |
| Audit Logs | 7 years | Archive then delete |
| Financial Records | 7 years | Archive |
| Support Tickets | 3 years | Archive then delete |

## Testing

```javascript
// Test data expiration
const testUser = await User.create({
  email: 'test@example.com',
  createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) // 400 days ago
});

// Run cleanup job
await runRetentionCleanup();

// Verify deletion
const deleted = await User.findById(testUser._id);
assert(deleted === null, 'Old user data should be deleted');
```

## References

- [GDPR Article 5(1)(e) - Storage Limitation](https://gdpr-info.eu/art-5-gdpr/)
- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [CCPA - Consumer Rights](https://oag.ca.gov/privacy/ccpa)
- [MongoDB TTL Indexes](https://docs.mongodb.com/manual/core/index-ttl/)
- [AWS S3 Lifecycle Management](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- Company Data Retention Policy: https://wiki.company.internal/policies/data-retention
