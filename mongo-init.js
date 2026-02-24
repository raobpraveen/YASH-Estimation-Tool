// MongoDB initialization script
// Creates default admin user and indexes

db = db.getSiblingDB('cost_analyzer');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "id": 1 }, { unique: true });
db.projects.createIndex({ "id": 1 }, { unique: true });
db.projects.createIndex({ "project_number": 1 });
db.projects.createIndex({ "created_by_id": 1 });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "is_archived": 1 });
db.audit_logs.createIndex({ "project_id": 1 });
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "user_id": 1 });
db.notifications.createIndex({ "user_email": 1 });
db.customers.createIndex({ "id": 1 }, { unique: true });
db.technologies.createIndex({ "id": 1 }, { unique: true });
db.skills.createIndex({ "id": 1 }, { unique: true });
db.base_locations.createIndex({ "id": 1 }, { unique: true });
db.proficiency_rates.createIndex({ "id": 1 }, { unique: true });

print('MongoDB initialization complete!');
