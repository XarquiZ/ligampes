const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Error: Credentials missing.");
    process.exit(1);
}

const supabase = createClient(url, key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runUtility() {
    const command = process.argv[2];

    if (command === 'select') {
        const table = process.argv[3];
        const columns = process.argv[4] || '*';
        const limit = process.argv[5] || 20;

        console.log(`Querying table: '${table}' (cols: ${columns})...`);

        // Using simple query
        const { data, error, count } = await supabase
            .from(table)
            .select(columns, { count: 'exact' })
            .limit(Number(limit));

        if (error) {
            console.error("❌ Error fetching data:", error);
        } else {
            console.log(`✅ Success! Found ${data.length} records (Total in DB: ${count})`);
            if (data && data.length > 0) {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log("⚠️ No records returned.");
            }
        }
    } else if (command === 'test-connection') {
        console.log("Testing connection on public.profiles...");
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) console.error("❌ Connection Error:", error);
        else console.log("✅ Connection OK. Profiles count:", data.length); // note: count is in header response usually but this verify auth.
    } else {
        console.log("Usage: node db-inspector.js select <table_name> [columns] [limit]");
    }
}

runUtility();
