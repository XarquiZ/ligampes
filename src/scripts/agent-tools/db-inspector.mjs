import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Error: Credentials missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function listTables() {
    console.log("Fetching public tables...");
    // Using PostgREST to query detailed info is harder without direct SQL access enabled.
    // But we can usually access information_schema if the role allows, OR we can just test select from known tables.

    // Since I don't have raw SQL access easily with just the JS client (unless via rpc),
    // I will try to inspect the schema via a clever trick if possible, or just standard PostgREST introspection?
    // Actually, Supabase JS client doesn't expose introspection easily.

    // However, I can try to simply 'select * from "information_schema"."tables"'.
    // Often RLS prevents this, but the Service Role Key often bypasses RLS.

    const { data, error } = await supabase
        .from('columns') // This is a guess, likely won't work directly on information_schema without setup.
        // Let's try raw RPC if available? No function known.

        // Fallback: We can't effectively "list all tables" via standard client unless we have a specific function.
        // BUT, the user gave me the schema via files. I know the tables exist.
        // This script will be used to QUERY specific tables.

        // For this specific 'listTables' request, I'll try to just list the ones I know exist to verify connectivity.
        .from('profiles').select('id, email').limit(1);

    if (error) {
        console.error("Connection failed or RLS blocked:", error);
    } else {
        console.log("Connection successful! Sample data from 'profiles':");
        console.table(data);
    }
}

async function runUtility() {
    const command = process.argv[2];

    if (command === 'test-connection') {
        await listTables();
    } else if (command === 'select') {
        const table = process.argv[3];
        if (!table) { console.error("Specify table"); return; }
        const { data, error } = await supabase.from(table).select('*').limit(10);
        if (error) console.error(error);
        else console.table(data);
    } else {
        console.log("Usage: node db-inspector.mjs [test-connection | select <table_name>]");
    }
}

runUtility();
