-- Retention Queries for TrioOnline
-- Focus: Cohort analysis (D1, D7, D30) for growth visibility and product health.

-- This query calculates retention metrics by cohort (registration day).
-- It identifies users who returned exactly N days after their registration.

WITH daily_cohorts AS (
    -- Group users by their registration date
    SELECT 
        DATE_TRUNC('day', created_at) AS registration_day,
        COUNT(id) AS cohort_size
    FROM "User"
    GROUP BY 1
),

user_activity AS (
    -- Get distinct user logins per day to avoid overcounting
    SELECT DISTINCT
        user_id,
        DATE_TRUNC('day', logged_at) AS activity_day
    FROM "UserLogin"
),

retention_counts AS (
    -- Calculate how many users from each cohort returned on specific days
    SELECT 
        DATE_TRUNC('day', u.created_at) AS registration_day,
        COUNT(DISTINCT CASE WHEN ua.activity_day = DATE_TRUNC('day', u.created_at) + INTERVAL '1 day' THEN ua.user_id END) AS d1_retained,
        COUNT(DISTINCT CASE WHEN ua.activity_day = DATE_TRUNC('day', u.created_at) + INTERVAL '7 days' THEN ua.user_id END) AS d7_retained,
        COUNT(DISTINCT CASE WHEN ua.activity_day = DATE_TRUNC('day', u.created_at) + INTERVAL '30 days' THEN ua.user_id END) AS d30_retained
    FROM "User" u
    LEFT JOIN user_activity ua ON u.id = ua.user_id
    GROUP BY 1
)

-- Final Dashboard View
-- Combines cohort size with retention numbers and percentages
SELECT 
    c.registration_day,
    c.cohort_size,
    r.d1_retained AS d1_count,
    CASE 
        WHEN c.cohort_size > 0 THEN ROUND((r.d1_retained::FLOAT / c.cohort_size) * 100, 2) 
        ELSE 0 
    END AS d1_percent,
    r.d7_retained AS d7_count,
    CASE 
        WHEN c.cohort_size > 0 THEN ROUND((r.d7_retained::FLOAT / c.cohort_size) * 100, 2) 
        ELSE 0 
    END AS d7_percent,
    r.d30_retained AS d30_count,
    CASE 
        WHEN c.cohort_size > 0 THEN ROUND((r.d30_retained::FLOAT / c.cohort_size) * 100, 2) 
        ELSE 0 
    END AS d30_percent
FROM daily_cohorts c
JOIN retention_counts r ON c.registration_day = r.registration_day
ORDER BY c.registration_day DESC;

-- Note: In production, these queries are intended to be used in BI tools like Metabase,
-- Grafana (SQL datasource), or custom internal dashboards.
