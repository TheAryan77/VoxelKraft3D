-- Order numbers start at VK-1001 (only moves the counter forward, never back).
SELECT setval(pg_get_serial_sequence('"Order"', 'number'), GREATEST(1000, (SELECT COALESCE(MAX("number"), 0) FROM "Order")));
