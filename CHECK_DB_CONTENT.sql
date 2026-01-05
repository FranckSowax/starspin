
-- Check count of merchants
SELECT count(*) as total_merchants FROM merchants;

-- Check count of users
SELECT count(*) as total_users FROM auth.users;

-- List first 5 merchants
SELECT id, email, business_name FROM merchants LIMIT 5;

-- List first 5 users
SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5;
